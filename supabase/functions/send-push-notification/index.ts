import { z } from "npm:zod@4.4.3";
import {
  authenticatedUser,
  requireAal2,
  serviceClient,
} from "../_shared/supabase.ts";
import {
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";

const Input = z.object({
  title: z.string().trim().min(1).max(120).optional(),

  body: z.string().trim().min(1).max(500).optional(),

  category: z
    .string()
    .regex(/^[a-z][a-z0-9_]{1,49}$/)
    .optional(),

  targetUrl: z.string().max(500).optional(),

  resourceId: z.string().uuid().optional(),

  audience: z
    .object({
      type: z
        .enum([
          "everyone",
          "program",
          "term",
          "subject",
          "users",
        ])
        .default("everyone"),

      programId: z.string().uuid().optional(),

      termId: z.string().uuid().optional(),

      subjectId: z.string().uuid().optional(),

      userIds: z
        .array(z.string().uuid())
        .max(100)
        .optional(),
    })
    .default({
      type: "everyone",
    }),

  testOnly: z.boolean().default(false),

  dryRun: z.boolean().default(false),

  jobId: z.string().uuid().optional(),
});

type Subscription = {
  id: string;
  user_id: string;
  token: string;
  platform: "web" | "android" | "ios";
};

type Delivery = {
  subscription_id: string;
  user_id: string;
  status: string;
  provider_message_id: string | null;
  error_code: string | null;
  error_message: string | null;
};

function required(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function base64url(
  value: Uint8Array | string,
): string {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : value;

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pemBytes(pem: string): Uint8Array {
  const normalized = pem
    .replace(
      /-----BEGIN PRIVATE KEY-----/g,
      "",
    )
    .replace(
      /-----END PRIVATE KEY-----/g,
      "",
    )
    .replace(/\s/g, "");

  if (!normalized) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY contains no key data",
    );
  }

  try {
    const binary = atob(normalized);

    return Uint8Array.from(
      binary,
      (character) =>
        character.charCodeAt(0),
    );
  } catch {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is not valid Base64 PEM data",
    );
  }
}

async function googleAccessToken():
  Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const clientEmail = required(
    "FIREBASE_CLIENT_EMAIL",
  );

  const privateKey = required(
    "FIREBASE_PRIVATE_KEY",
  ).replace(/\\n/g, "\n");

  if (
    !privateKey.includes(
      "-----BEGIN PRIVATE KEY-----",
    )
  ) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is missing BEGIN PRIVATE KEY",
    );
  }

  if (
    !privateKey.includes(
      "-----END PRIVATE KEY-----",
    )
  ) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is missing END PRIVATE KEY",
    );
  }

  const header = base64url(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    }),
  );

  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope:
        "https://www.googleapis.com/auth/firebase.messaging",
      aud:
        "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  let key: CryptoKey;

  try {
    key = await crypto.subtle.importKey(
      "pkcs8",
      pemBytes(privateKey),
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );
  } catch (error) {
    console.error(
      "Firebase private-key import failed",
      {
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    throw new Error(
      "FIREBASE_PRIVATE_KEY could not be imported",
    );
  }

  const unsignedToken =
    `${header}.${claims}`;

  const signature =
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(
        unsignedToken,
      ),
    );

  const assertion =
    `${unsignedToken}.${base64url(
      new Uint8Array(signature),
    )}`;

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",

      headers: {
        "content-type":
          "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        grant_type:
          "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
  );

  const result = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Firebase OAuth request failed",
      {
        status: response.status,
        error:
          typeof result === "object" &&
          result !== null
            ? result
            : "Unknown OAuth error",
      },
    );

    throw new Error(
      "firebase_oauth_failed",
    );
  }

  if (
    !result ||
    typeof result !== "object" ||
    !("access_token" in result) ||
    typeof result.access_token !== "string"
  ) {
    throw new Error(
      "firebase_oauth_token_missing",
    );
  }

  return result.access_token;
}

function safeRoute(
  value: string | undefined,
): string {
  if (!value) {
    return "/resources";
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\r\n]/.test(value)
  ) {
    throw new PublicError(
      "invalid_target_url",
      "Target URL must be an internal application route.",
    );
  }

  return value;
}

function errorDetails(
  value: unknown,
): {
  code: string;
  message: string;
} {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return {
      code: "unknown",
      message: "Delivery failed.",
    };
  }

  const nestedError =
    "error" in value &&
    value.error &&
    typeof value.error === "object"
      ? value.error
      : value;

  const code =
    "status" in nestedError &&
    typeof nestedError.status === "string"
      ? nestedError.status
      : "code" in nestedError &&
          typeof nestedError.code ===
            "string"
        ? nestedError.code
        : "unknown";

  const message =
    "message" in nestedError &&
    typeof nestedError.message ===
      "string"
      ? nestedError.message.slice(
          0,
          240,
        )
      : "Delivery failed.";

  return {
    code,
    message,
  };
}

async function runBounded<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;

  const workerCount = Math.min(
    limit,
    items.length,
  );

  await Promise.all(
    Array.from(
      {
        length: workerCount,
      },
      async () => {
        while (index < items.length) {
          const currentIndex = index;

          index += 1;

          const item =
            items[currentIndex];

          if (item !== undefined) {
            await task(item);
          }
        }
      },
    ),
  );
}

function isQuiet(
  preference: Record<
    string,
    unknown
  >,
): boolean {
  if (
    !preference.quiet_hours_enabled ||
    typeof preference.quiet_hours_start !==
      "string" ||
    typeof preference.quiet_hours_end !==
      "string"
  ) {
    return false;
  }

  try {
    const timezone =
      typeof preference.timezone ===
      "string"
        ? preference.timezone
        : "UTC";

    const parts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        },
      ).formatToParts(new Date());

    const hour =
      parts.find(
        (part) =>
          part.type === "hour",
      )?.value ?? "00";

    const minute =
      parts.find(
        (part) =>
          part.type === "minute",
      )?.value ?? "00";

    const current =
      `${hour}:${minute}`;

    const start =
      preference.quiet_hours_start.slice(
        0,
        5,
      );

    const end =
      preference.quiet_hours_end.slice(
        0,
        5,
      );

    return start <= end
      ? current >= start &&
          current < end
      : current >= start ||
          current < end;
  } catch {
    return false;
  }
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
    const optionsResponse =
      handleOptions(request);

    if (optionsResponse) {
      return optionsResponse;
    }

    if (request.method !== "POST") {
      return jsonResponse(
        request,
        {
          error:
            "method_not_allowed",
        },
        405,
      );
    }

    try {
      console.log(
        "send-push-notification: request started",
      );

      const { user, client } =
        await authenticatedUser(
          request,
        );

      console.log(
        "send-push-notification: authenticated",
        {
          userId: user.id,
        },
      );

      await requireAal2(
        client,
        request,
      );

      console.log(
        "send-push-notification: AAL2 verified",
      );

      const service =
        serviceClient();

      const {
        data: roles,
        error: roleError,
      } = await service
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", [
          "admin",
          "super_admin",
        ]);

      if (roleError) {
        throw roleError;
      }

      if (!roles?.length) {
        throw new PublicError(
          "forbidden",
          "Administrator role is required.",
          403,
        );
      }

      const requestJson =
        await request.json();

      const parsed =
        Input.safeParse(
          requestJson,
        );

      if (!parsed.success) {
        console.error(
          "Notification request validation failed",
          parsed.error.flatten(),
        );

        throw new PublicError(
          "invalid_request",
          "Notification request is invalid.",
          400,
        );
      }

      let input = parsed.data;

      let job: {
        id: string;
        payload: Record<
          string,
          unknown
        >;
      } | null = null;

      if (input.jobId) {
        const result =
          await service
            .from(
              "push_notification_jobs",
            )
            .select(
              "id,payload,status",
            )
            .eq(
              "id",
              input.jobId,
            )
            .eq(
              "status",
              "queued",
            )
            .lte(
              "available_at",
              new Date().toISOString(),
            )
            .maybeSingle();

        if (result.error) {
          throw result.error;
        }

        if (!result.data) {
          throw new PublicError(
            "job_unavailable",
            "Notification job is not ready.",
            409,
          );
        }

        job = result.data;

        const jobInput =
          Input.safeParse(
            job.payload,
          );

        if (!jobInput.success) {
          throw new PublicError(
            "invalid_job",
            "Notification job payload is invalid.",
            409,
          );
        }

        input = jobInput.data;

        const {
          error:
            jobUpdateError,
        } = await service
          .from(
            "push_notification_jobs",
          )
          .update({
            status: "processing",
            attempts: 1,
          })
          .eq("id", job.id)
          .eq(
            "status",
            "queued",
          );

        if (jobUpdateError) {
          throw jobUpdateError;
        }
      }

      if (
        !input.title ||
        !input.body ||
        !input.category
      ) {
        throw new PublicError(
          "invalid_request",
          "Title, body, and category are required.",
          400,
        );
      }

      const targetUrl =
        safeRoute(
          input.targetUrl,
        );

      const audience =
        input.testOnly
          ? {
              type:
                "users" as const,
              userIds: [
                user.id,
              ],
            }
          : input.audience;

      console.log(
        "send-push-notification: creating campaign",
        {
          audienceType:
            audience.type,
          testOnly:
            input.testOnly,
          dryRun:
            input.dryRun,
        },
      );

      const {
        data: campaign,
        error: campaignError,
      } = await service
        .from(
          "push_notification_campaigns",
        )
        .insert({
          title:
            input.title,
          body:
            input.body,
          category:
            input.category,
          target_url:
            targetUrl,
          resource_id:
            input.resourceId ??
            null,
          created_by:
            user.id,
          audience,
          status:
            "sending",
        })
        .select("id")
        .single();

      if (campaignError) {
        throw campaignError;
      }

      let subscriptionsQuery =
        service
          .from(
            "push_subscriptions",
          )
          .select(
            "id,user_id,token,platform",
          )
          .eq(
            "enabled",
            true,
          )
          .gte(
            "last_seen_at",
            new Date(
              Date.now() -
                180 *
                  86_400_000,
            ).toISOString(),
          )
          .limit(5000);

      if (
        audience.type ===
          "users" &&
        audience.userIds
          ?.length
      ) {
        subscriptionsQuery =
          subscriptionsQuery.in(
            "user_id",
            audience.userIds,
          );
      }

      const {
        data:
          subscriptionRows,
        error:
          subscriptionsError,
      } =
        await subscriptionsQuery;

      if (
        subscriptionsError
      ) {
        throw subscriptionsError;
      }

      const subscriptions =
        (subscriptionRows ??
          []) as Subscription[];

      const userIds = [
        ...new Set(
          subscriptions.map(
            (row) =>
              row.user_id,
          ),
        ),
      ];

      const preferenceResult =
        userIds.length
          ? await service
              .from(
                "notification_preferences",
              )
              .select(
                [
                  "user_id",
                  "push_enabled",
                  "resource_updates",
                  "system_announcements",
                  "new_resources",
                  "past_questions",
                  "account_security",
                  "program_id",
                  "term_id",
                  "subject_ids",
                  "quiet_hours_enabled",
                  "quiet_hours_start",
                  "quiet_hours_end",
                  "timezone",
                ].join(","),
              )
              .in(
                "user_id",
                userIds,
              )
          : {
              data: [],
              error: null,
            };

      if (
        preferenceResult.error
      ) {
        throw preferenceResult.error;
      }

      const preferences =
        new Map(
          (
            preferenceResult.data ??
            []
          ).map((row) => [
            row.user_id,
            row,
          ]),
        );

      const eligible =
        subscriptions.filter(
          (row) => {
            const preference =
              preferences.get(
                row.user_id,
              ) as
                | Record<
                    string,
                    unknown
                  >
                | undefined;

            if (
              !preference ||
              preference.push_enabled !==
                true
            ) {
              return false;
            }

            if (
              audience.type ===
                "program" &&
              preference.program_id &&
              preference.program_id !==
                audience.programId
            ) {
              return false;
            }

            if (
              audience.type ===
                "term" &&
              preference.term_id &&
              preference.term_id !==
                audience.termId
            ) {
              return false;
            }

            if (
              audience.type ===
                "subject" &&
              Array.isArray(
                preference.subject_ids,
              ) &&
              preference
                .subject_ids
                .length > 0 &&
              !preference.subject_ids.includes(
                audience.subjectId,
              )
            ) {
              return false;
            }

            const categoryAllowed =
              input.category ===
              "administrative_announcement"
                ? preference.system_announcements
                : input.category ===
                    "past_question"
                  ? preference.past_questions
                  : input.category ===
                      "account_security"
                    ? preference.account_security
                    : input.category ===
                        "new_resource"
                      ? preference.new_resources
                      : preference.resource_updates;

            if (
              categoryAllowed !==
              true
            ) {
              return false;
            }

            return (
              input.category ===
                "account_security" ||
              !isQuiet(
                preference,
              )
            );
          },
        );

      console.log(
        "send-push-notification: recipients resolved",
        {
          subscriptions:
            subscriptions.length,
          eligible:
            eligible.length,
        },
      );

      if (input.dryRun) {
        const {
          error: cancelError,
        } = await service
          .from(
            "push_notification_campaigns",
          )
          .update({
            status:
              "cancelled",
          })
          .eq(
            "id",
            campaign.id,
          );

        if (cancelError) {
          throw cancelError;
        }

        return jsonResponse(
          request,
          {
            campaignId:
              campaign.id,
            recipients:
              eligible.length,
            sent: 0,
            failed: 0,
            skipped:
              subscriptions.length -
              eligible.length,
            status:
              "cancelled",
          },
        );
      }

      const projectId =
        required(
          "FIREBASE_PROJECT_ID",
        );

      console.log(
        "Firebase configuration check",
        {
          hasProjectId:
            Boolean(
              projectId,
            ),
          hasClientEmail:
            Boolean(
              Deno.env.get(
                "FIREBASE_CLIENT_EMAIL",
              ),
            ),
          hasPrivateKey:
            Boolean(
              Deno.env.get(
                "FIREBASE_PRIVATE_KEY",
              ),
            ),
        },
      );

      const accessToken =
        eligible.length
          ? await googleAccessToken()
          : "";

      const eligibleIds =
        new Set(
          eligible.map(
            (row) => row.id,
          ),
        );

      const deliveries:
        Delivery[] =
        subscriptions
          .filter(
            (row) =>
              !eligibleIds.has(
                row.id,
              ),
          )
          .map((row) => ({
            subscription_id:
              row.id,
            user_id:
              row.user_id,
            status:
              "skipped",
            provider_message_id:
              null,
            error_code:
              "preference_filtered",
            error_message:
              null,
          }));

      await runBounded(
        eligible,
        8,
        async (
          subscription,
        ) => {
          const data = {
            title:
              input.title!,
            body:
              input.body!,
            url:
              targetUrl,
            resourceId:
              input.resourceId ??
              "",
            notificationId:
              campaign.id,
            category:
              input.category!,
            timestamp:
              String(
                Date.now(),
              ),
            tag:
              input.resourceId
                ? `resource-${input.resourceId}`
                : `campaign-${campaign.id}`,
            icon:
              "/icons/icon-192.png",
            badge:
              "/icons/badge-96.png",
            requireInteraction:
              "false",
          };

          /*
           * Web receives a data-only message.
           * The Workbox service worker displays the
           * notification using showNotification().
           *
           * Android and iOS receive native notification
           * payloads with platform-specific settings.
           */
          const message =
            subscription.platform ===
            "web"
              ? {
                  token:
                    subscription.token,

                  data,

                  webpush: {
                    headers: {
                      Urgency:
                        "high",
                      TTL:
                        "86400",
                    },
                  },
                }
              : subscription.platform ===
                  "android"
                ? {
                    token:
                      subscription.token,

                    notification:
                      {
                        title:
                          input.title!,
                        body:
                          input.body!,
                      },

                    data,

                    android: {
                      priority:
                        "high",

                      notification:
                        {
                          channel_id:
                            "academic_updates",
                          click_action:
                            "FCM_PLUGIN_ACTIVITY",
                          sound:
                            "default",
                          default_vibrate_timings:
                            true,
                        },
                    },
                  }
                : {
                    token:
                      subscription.token,

                    notification:
                      {
                        title:
                          input.title!,
                        body:
                          input.body!,
                      },

                    data,

                    apns: {
                      headers: {
                        "apns-priority":
                          "10",
                      },

                      payload: {
                        aps: {
                          sound:
                            "default",
                          badge: 1,
                          "mutable-content":
                            1,
                        },
                      },
                    },
                  };

          const sendRequest =
            () =>
              fetch(
                `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
                  projectId,
                )}/messages:send`,
                {
                  method:
                    "POST",

                  headers: {
                    authorization:
                      `Bearer ${accessToken}`,
                    "content-type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      message,
                    }),
                },
              );

          let response =
            await sendRequest();

          if (
            response.status ===
              429 ||
            response.status >=
              500
          ) {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  300,
                ),
            );

            response =
              await sendRequest();
          }

          const result =
            await response
              .json()
              .catch(
                () => ({}),
              );

          if (response.ok) {
            deliveries.push({
              subscription_id:
                subscription.id,
              user_id:
                subscription.user_id,
              status:
                "sent",
              provider_message_id:
                typeof result.name ===
                "string"
                  ? result.name.slice(
                      0,
                      500,
                    )
                  : null,
              error_code:
                null,
              error_message:
                null,
            });

            return;
          }

          const detail =
            errorDetails(
              result,
            );

          const invalidToken =
            [
              "UNREGISTERED",
              "INVALID_ARGUMENT",
              "NOT_FOUND",
            ].includes(
              detail.code,
            ) ||
            /registration token|unregistered/i.test(
              detail.message,
            );

          deliveries.push({
            subscription_id:
              subscription.id,
            user_id:
              subscription.user_id,
            status:
              invalidToken
                ? "invalid_token"
                : "failed",
            provider_message_id:
              null,
            error_code:
              detail.code.slice(
                0,
                120,
              ),
            error_message:
              detail.message,
          });

          if (
            invalidToken
          ) {
            const {
              error:
                disableError,
            } = await service
              .from(
                "push_subscriptions",
              )
              .update({
                enabled:
                  false,
              })
              .eq(
                "id",
                subscription.id,
              );

            if (
              disableError
            ) {
              console.error(
                "Could not disable invalid subscription",
                {
                  subscriptionId:
                    subscription.id,
                  message:
                    disableError.message,
                },
              );
            }
          }
        },
      );

      if (
        deliveries.length
      ) {
        const {
          error:
            deliveryInsertError,
        } = await service
          .from(
            "notification_deliveries",
          )
          .insert(
            deliveries.map(
              (row) => ({
                campaign_id:
                  campaign.id,
                ...row,
              }),
            ),
          );

        if (
          deliveryInsertError
        ) {
          throw deliveryInsertError;
        }
      }

      const sent =
        deliveries.filter(
          (row) =>
            row.status ===
            "sent",
        ).length;

      const failed =
        deliveries.filter(
          (row) =>
            row.status ===
              "failed" ||
            row.status ===
              "invalid_token",
        ).length;

      const skipped =
        deliveries.filter(
          (row) =>
            row.status ===
            "skipped",
        ).length;

      const status =
        failed === 0
          ? "sent"
          : sent > 0
            ? "partially_failed"
            : "failed";

      const {
        error:
          campaignUpdateError,
      } = await service
        .from(
          "push_notification_campaigns",
        )
        .update({
          status,
          sent_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          campaign.id,
        );

      if (
        campaignUpdateError
      ) {
        throw campaignUpdateError;
      }

      if (job) {
        const {
          error:
            jobCompleteError,
        } = await service
          .from(
            "push_notification_jobs",
          )
          .update({
            status:
              failed > 0 &&
              sent === 0
                ? "failed"
                : "completed",
            processed_at:
              new Date().toISOString(),
            campaign_id:
              campaign.id,
          })
          .eq(
            "id",
            job.id,
          );

        if (
          jobCompleteError
        ) {
          throw jobCompleteError;
        }
      }

      return jsonResponse(
        request,
        {
          campaignId:
            campaign.id,
          recipients:
            eligible.length,
          sent,
          failed,
          skipped,
          status,
        },
      );
    } catch (error) {
      const details =
        error instanceof Error
          ? {
              name:
                error.name,
              message:
                error.message,
              stack:
                error.stack,
            }
          : typeof error ===
                "object" &&
              error !== null
            ? error
            : {
                message:
                  String(error),
              };

      console.error(
        "send-push-notification failed",
        details,
      );

      const message =
        error instanceof Error
          ? error.message
          : typeof error ===
                "object" &&
              error !== null &&
              "message" in
                error &&
              typeof error.message ===
                "string"
            ? error.message
            : "Unknown push notification failure.";

      const status =
        error instanceof
        PublicError
          ? error.status
          : 500;

      return jsonResponse(
        request,
        {
          error:
            error instanceof
            PublicError
              ? error.code
              : "push_notification_failed",

          message,

          // Remove after production debugging is complete.
          details,
        },
        status,
      );
    }
  },
);