type NotificationProps = {
  to: string;
  notificationTitle: string;
  notificationContent: string;
  appName?: string;
  logoUrl?: string;
  userName?: string;
  actionLink?: string;
  actionText?: string;
  supportEmail?: string;
  year?: number;
};

export const NotificationTemplate = ({
  to,
  appName = "HealthCare",
  logoUrl,
  userName = "Utilisateur",
  notificationTitle,
  notificationContent,
  actionLink,
  actionText = "Voir les détails",
  supportEmail = "noreply@glaceandconfort.com",
  year = new Date().getFullYear(),
}: Readonly<NotificationProps>): React.ReactNode => {
  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {logoUrl && (
          <div className="text-center py-6 bg-white border-b border-gray-100">
            <img
              src={logoUrl}
              alt={`${appName} Logo`}
              className="h-10 mx-auto"
            />
          </div>
        )}
        <div className="p-6 bg-white">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
            {notificationTitle}
          </h2>
          {userName && (
            <p className="text-gray-700 mb-4">Bonjour {userName},</p>
          )}
          <p className="text-gray-700 mb-6">{notificationContent}</p>
          {actionLink && (
            <div className="bg-gray-50 rounded-md p-4 text-center mb-6">
              <a
                href={actionLink}
                className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
              >
                {actionText}
              </a>
            </div>
          )}
          {supportEmail && (
            <p className="text-gray-700 mb-2">
              Si vous avez des questions, n&apos;hésitez pas à nous contacter à{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="text-blue-600 hover:underline"
              >
                {supportEmail}
              </a>
              .
            </p>
          )}
          <p className="text-gray-700">
            Cordialement,
            <br />
            L&apos;équipe {appName}
          </p>
        </div>
        {to && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
            {to && <p className="mb-2">Cet email a été envoyé à {to}</p>}
            <p>&copy; {year} HealthCare. Tous droits réservés.</p>
          </div>
        )}
      </div>
    </div>
  );
};
