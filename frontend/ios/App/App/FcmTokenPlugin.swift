import Capacitor
import FirebaseCore
import FirebaseMessaging

@objc(FcmTokenPlugin)
public class FcmTokenPlugin: CAPPlugin, CAPBridgedPlugin, MessagingDelegate {
    public let identifier = "FcmTokenPlugin"
    public let jsName = "FcmToken"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getToken", returnType: CAPPluginReturnPromise)
    ]

    public override func load() {
        if FirebaseApp.app() == nil { FirebaseApp.configure() }
        Messaging.messaging().delegate = self
    }

    @objc func getToken(_ call: CAPPluginCall) {
        Messaging.messaging().token { token, error in
            if let error = error {
                call.reject("FCM token is unavailable.", nil, error)
                return
            }
            guard let token = token, !token.isEmpty else {
                call.reject("FCM token is unavailable.")
                return
            }
            call.resolve(["token": token])
        }
    }

    public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken, !token.isEmpty else { return }
        notifyListeners("tokenReceived", data: ["token": token])
    }
}
