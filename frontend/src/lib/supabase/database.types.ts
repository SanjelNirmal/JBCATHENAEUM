// Typed schema snapshot for migrations through 202607180013. Compare it with
// `supabase gen types typescript --linked` after every linked deployment.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole =
  "student" | "contributor" | "faculty" | "moderator" | "admin" | "super_admin";
export type AccountStatus = "active" | "suspended" | "disabled";
export type ResourceStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "rejected"
  | "archived";
export type SubmissionStatus =
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "withdrawn";
export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";
export type ResourceVisibility =
  "public" | "authenticated" | "restricted" | "private";

type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

interface PublicResourceSearchRow extends Record<string, unknown> {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  academic_year: number | null;
  resource_type: string;
  program_id: string;
  program_name: string;
  faculty_id: string;
  faculty_name: string;
  term_id: string;
  term_name: string;
  subject_id: string;
  subject_name: string;
  category_id: string;
  category_name: string;
  contributor_id: string | null;
  contributor_name: string;
  legacy_url: string | null;
  byte_size: number | null;
  page_count: number | null;
  download_count: number;
  created_at: string;
  total_count: number;
}

interface PublicContributorProfileRow extends Record<string, unknown> {
  id: string;
  name: string;
  faculty: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  resource_count: number;
  rating_count: number;
  average_rating: number;
}

interface PublicResourceRatingRow extends Record<string, unknown> {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_faculty: string;
  reviewer_avatar_url: string | null;
  total_count: number;
}

export interface Database {
  public: {
    Tables: {
      campuses: Table<{
        id: string;
        name: string;
        slug: string;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      }>;
      faculties: Table<{
        id: string;
        campus_id: string;
        name: string;
        slug: string;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      }>;
      programs: Table<{
        id: string;
        campus_id: string;
        faculty_id: string;
        name: string;
        slug: string;
        code: string | null;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      }>;
      curriculum_versions: Table<{
        id: string;
        program_id: string;
        name: string;
        slug: string;
        effective_year: number | null;
        is_current: boolean;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      }>;
      terms: Table<{
        id: string;
        program_id: string;
        curriculum_version_id: string;
        name: string;
        slug: string;
        term_number: number | null;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      }>;
      subjects: Table<{
        id: string;
        program_id: string;
        curriculum_version_id: string;
        term_id: string;
        name: string;
        slug: string;
        code: string | null;
        description: string | null;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      }>;
      resource_categories: Table<{
        id: string;
        campus_id: string;
        name: string;
        slug: string;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
      }>;
      profiles: Table<{
        id: string;
        name: string;
        faculty: string | null;
        avatar_url: string | null;
        bio: string | null;
        account_status: AccountStatus;
        suspended_at: string | null;
        suspended_by: string | null;
        suspension_reason: string | null;
        created_at: string;
        updated_at: string;
      }>;
      user_roles: Table<{
        user_id: string;
        role: AppRole;
        granted_by: string | null;
        created_at: string;
      }>;
      resources: Table<{
        id: string;
        campus_id: string;
        program_id: string;
        curriculum_version_id: string;
        term_id: string;
        subject_id: string;
        category_id: string;
        owner_id: string | null;
        author_name: string | null;
        title: string;
        slug: string;
        description: string | null;
        abstract: string | null;
        visibility: ResourceVisibility;
        thumbnail_path: string | null;
        seo_title: string | null;
        seo_description: string | null;
        academic_year: number | null;
        resource_type: string;
        status: ResourceStatus;
        current_version_id: string | null;
        published_at: string | null;
        created_at: string;
        updated_at: string;
        download_count: number;
        view_count: number;
        deleted_at: string | null;
        archived_at: string | null;
        reviewer_id: string | null;
        file_url: string | null;
      }>;
      resource_versions: Table<{
        id: string;
        resource_id: string;
        version_number: number;
        mime_type: string;
        byte_size: number | null;
        page_count: number | null;
        scan_status: string;
        is_current: boolean;
        created_at: string;
      }>;
      resource_upload_sessions: Table<{
        id: string;
        resource_id: string;
        version_id: string;
        user_id: string;
        original_filename: string;
        expected_byte_size: number;
        upload_policy_slug: string | null;
        upload_policy_version: string | null;
        upload_policy_accepted_at: string | null;
        status: string;
        expires_at: string;
        completed_at: string | null;
        promoted_at: string | null;
        failure_code: string | null;
        created_at: string;
        updated_at: string;
      }>;
      resource_submissions: Table<{
        id: string;
        resource_id: string;
        version_id: string;
        submitter_id: string;
        reviewer_id: string | null;
        status: SubmissionStatus;
        submitted_at: string;
        decided_at: string | null;
        resubmission_of: string | null;
        upload_policy_slug: string | null;
        upload_policy_version: string | null;
        upload_policy_accepted_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      resource_reviews: Table<{
        id: string;
        submission_id: string;
        resource_id: string;
        reviewer_id: string;
        decision: string;
        comment: string | null;
        rejection_reason: string | null;
        requested_changes: string | null;
        created_at: string;
      }>;
      resource_bookmarks: Table<{
        id: string;
        user_id: string;
        resource_id: string;
        created_at: string;
      }>;
      resource_ratings: Table<{
        id: string;
        user_id: string;
        resource_id: string;
        rating: number;
        review_text: string | null;
        moderation_status: "visible" | "pending" | "hidden";
        created_at: string;
        updated_at: string;
      }>;
      resource_download_events: Table<{
        id: number;
        resource_id: string;
        user_id: string | null;
        version_id: string | null;
        downloaded_at: string;
      }>;
      review_comments: Table<{
        id: string;
        submission_id: string;
        author_id: string;
        body: string;
        is_internal: boolean;
        created_at: string;
        updated_at: string;
      }>;
      notifications: Table<{
        id: string;
        user_id: string;
        notification_type: string;
        title: string;
        message: string;
        entity_type: string | null;
        entity_id: string | null;
        read_at: string | null;
        created_at: string;
      }>;
      notification_preferences: Table<{
        user_id: string;
        in_app_enabled: boolean;
        email_enabled: boolean;
        push_enabled: boolean;
        submission_updates: boolean;
        resource_updates: boolean;
        moderation_updates: boolean;
        system_announcements: boolean;
        created_at: string;
        updated_at: string;
      }>;
      user_devices: Table<{
        id: string;
        user_id: string;
        device_key: string;
        platform: "web" | "android" | "ios";
        push_token: string | null;
        device_name: string | null;
        app_version: string | null;
        notifications_enabled: boolean;
        last_active_at: string;
        created_at: string;
        updated_at: string;
      }>;
      resource_reports: Table<{
        id: string;
        resource_id: string;
        reporter_id: string;
        reason: string;
        details: string | null;
        status: ReportStatus;
        created_at: string;
      }>;
      content_removal_requests: Table<{
        id: string;
        resource_id: string | null;
        requester_name: string;
        requester_email: string;
        relationship: string;
        reason: string;
        details: string;
        evidence_url: string | null;
        status: ReportStatus;
        created_at: string;
      }>;
      audit_events: Table<{
        id: number;
        actor_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Json;
        created_at: string;
      }>;
      newsletter_subscriptions: Table<{
        id: string;
        email: string;
        status: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      search_public_resources: {
        Args: {
          search_query: string | null;
          faculty_filter: string | null;
          program_filter: string | null;
          term_filter: string | null;
          subject_filter: string | null;
          category_filter: string | null;
          contributor_filter: string | null;
          academic_year_filter: number | null;
          uploaded_from: string | null;
          uploaded_to: string | null;
          sort_by: string;
          page_number: number;
          page_size: number;
        };
        Returns: PublicResourceSearchRow[];
      };
      get_public_contributor_profile: {
        Args: { target_user_id: string };
        Returns: PublicContributorProfileRow[];
      };
      get_public_resource_contributor: {
        Args: { target_resource_id: string };
        Returns: PublicContributorProfileRow[];
      };
      list_public_resource_ratings: {
        Args: {
          target_resource_id: string;
          page_number: number;
          page_size: number;
        };
        Returns: PublicResourceRatingRow[];
      };
      toggle_resource_bookmark: {
        Args: {
          target_resource_id: string;
          next_bookmarked: boolean;
        };
        Returns: boolean;
      };
      save_resource_rating: {
        Args: {
          target_resource_id: string;
          next_rating: number;
          next_review_text: string | null;
        };
        Returns: undefined;
      };
      delete_resource_rating: {
        Args: { target_resource_id: string };
        Returns: undefined;
      };
      public_platform_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, number>;
      };
      get_resource_rating_summary: {
        Args: { target_resource_id: string };
        Returns: Array<{ average_rating: number; rating_count: number }>;
      };
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      list_my_download_history: {
        Args: { page_number: number; page_size: number };
        Returns: Array<{
          event_id: number;
          resource_id: string;
          resource_title: string;
          resource_slug: string;
          version_number: number | null;
          downloaded_at: string;
          total_count: number;
        }>;
      };
      record_resource_download: {
        Args: {
          target_resource_id: string;
          event_user_id: string | null;
          target_version_id: string | null;
        };
        Returns: undefined;
      };
      admin_dashboard_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, number>;
      };
      list_admin_resources: {
        Args: {
          search_query: string | null;
          status_filter: ResourceStatus | null;
          program_filter: string | null;
          term_filter: string | null;
          subject_filter: string | null;
          contributor_filter: string | null;
          created_from: string | null;
          created_to: string | null;
          sort_by: string;
          page_number: number;
          page_size: number;
        };
        Returns: Array<{
          id: string;
          title: string;
          status: ResourceStatus;
          created_at: string;
          program_id: string;
          term_id: string;
          subject_id: string;
          owner_id: string | null;
          download_count: number;
          total_count: number;
        }>;
      };
      list_review_queue: {
        Args: {
          search_query: string | null;
          status_filter: SubmissionStatus | null;
          page_number: number;
          page_size: number;
        };
        Returns: Array<{
          submission_id: string;
          resource_id: string;
          version_id: string;
          submitter_id: string;
          contributor: string;
          status: SubmissionStatus;
          submitted_at: string;
          title: string;
          program: string;
          faculty: string;
          term: string;
          subject: string;
          category: string;
          byte_size: number | null;
          page_count: number | null;
          mime_type: string;
          scan_status: string;
          duplicate_warning: boolean;
          review_notes: string[];
          total_count: number;
        }>;
      };
      list_resource_review_history: {
        Args: { target_resource_id: string };
        Returns: Array<{
          id: string;
          version_number: number;
          mime_type: string;
          byte_size: number | null;
          page_count: number | null;
          scan_status: string;
          scan_result: Json;
          failure_code: string | null;
          is_current: boolean;
          created_at: string;
        }>;
      };
      set_user_role: {
        Args: {
          target_user_id: string;
          target_role: AppRole;
          should_grant: boolean;
        };
        Returns: undefined;
      };
      set_account_status: {
        Args: {
          target_user_id: string;
          next_status: AccountStatus;
          supplied_reason: string;
        };
        Returns: undefined;
      };
      update_user_profile_safe: {
        Args: {
          target_user_id: string;
          next_name: string;
          next_faculty: string;
          next_avatar_url: string;
          next_bio: string;
        };
        Returns: undefined;
      };
      archive_resource: {
        Args: { target_resource_id: string };
        Returns: undefined;
      };
      restore_resource: {
        Args: { target_resource_id: string };
        Returns: undefined;
      };
      bulk_resource_state: {
        Args: {
          target_resource_ids: string[];
          requested_action: string;
          supplied_reason: string;
        };
        Returns: Json;
      };
      update_resource_metadata: {
        Args: {
          target_resource_id: string;
          next_title: string;
          next_description: string;
          next_category_id: string;
          next_academic_year: number;
        };
        Returns: undefined;
      };
      submit_resource_report: {
        Args: {
          target_resource_id: string;
          report_reason: string;
          report_details: string | null;
        };
        Returns: string;
      };
      claim_resource_review: {
        Args: { target_submission_id: string };
        Returns: undefined;
      };
      assign_resource_reviewer: {
        Args: { target_submission_id: string; target_reviewer_id: string };
        Returns: undefined;
      };
      archive_review_submission: {
        Args: { target_submission_id: string; supplied_reason: string };
        Returns: undefined;
      };
      add_review_comment: {
        Args: {
          target_submission_id: string;
          comment_body: string;
          internal_comment: boolean;
        };
        Returns: string;
      };
      resolve_resource_report: {
        Args: {
          target_report_id: string;
          resolution: string;
          supplied_resolution_note: string;
        };
        Returns: undefined;
      };
      resolve_content_removal_request: {
        Args: {
          target_request_id: string;
          resolution: string;
          supplied_note: string;
        };
        Returns: undefined;
      };
      subscribe_to_newsletter: {
        Args: { subscriber_email: string };
        Returns: string;
      };
    };
    Enums: {
      app_role: AppRole;
      account_status: AccountStatus;
      resource_status: ResourceStatus;
      submission_status: SubmissionStatus;
      report_status: ReportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
