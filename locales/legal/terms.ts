/**
 * 利用規約の多言語コンテンツ
 *
 * 英語をカノニカルとし、各言語の翻訳を提供する。
 * Google OAuth 本番審査用。
 */
import type { Locale } from "@/locales";

export const termsContent: Record<Locale, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: March 15, 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing or using Clipped, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.",
      },
      {
        heading: "2. Service Description",
        body: "Clipped is a note-taking application that allows you to create, edit, and organize notes. The service is provided free of charge by an individual developer.",
      },
      {
        heading: "3. User Accounts",
        body: `You may use Clipped without an account (data stored locally in your browser).
If you choose to log in with Google OAuth, you agree to provide accurate account information.
You are responsible for maintaining the security of your account.`,
      },
      {
        heading: "4. Acceptable Use",
        body: `You agree not to:
• Use the service for any illegal purpose
• Upload content that infringes on others' rights
• Attempt to gain unauthorized access to the service
• Use the service to distribute malware or spam`,
      },
      {
        heading: "5. User Content",
        body: `You retain ownership of all content you create in Clipped.
We do not claim any rights over your notes or images.
You are solely responsible for the content you store.`,
      },
      {
        heading: "6. Service Availability",
        body: "We strive to keep Clipped available, but we do not guarantee uninterrupted service. The service may be temporarily unavailable for maintenance or updates.",
      },
      {
        heading: "7. Limitation of Liability",
        body: "Clipped is provided \"as is\" without warranty of any kind. The operator shall not be liable for any damages arising from the use of or inability to use the service, including data loss.",
      },
      {
        heading: "8. Data Handling",
        body: "Please refer to our Privacy Policy for details on how we handle your data. By using the service, you also agree to our Privacy Policy.",
      },
      {
        heading: "9. Changes to Terms",
        body: "We may update these terms from time to time. Changes will be reflected on this page. Continued use of the service after changes constitutes acceptance of the new terms.",
      },
      {
        heading: "10. Contact",
        body: "For questions about these terms, please contact: fwjg2507@gmail.com",
      },
    ],
  },
  ja: {
    title: "利用規約",
    lastUpdated: "最終更新日: 2026年3月15日",
    sections: [
      {
        heading: "1. 規約への同意",
        body: "Clipped にアクセスまたは使用することにより、本利用規約に同意したものとみなされます。同意いただけない場合は、サービスのご利用をお控えください。",
      },
      {
        heading: "2. サービスの説明",
        body: "Clipped は、メモの作成、編集、整理ができるメモアプリケーションです。個人開発者により無料で提供されています。",
      },
      {
        heading: "3. ユーザーアカウント",
        body: `アカウントなしでも Clipped をご利用いただけます（データはブラウザに保存されます）。
Google OAuth でログインする場合、正確なアカウント情報を提供することに同意するものとします。
アカウントのセキュリティ維持はお客様の責任となります。`,
      },
      {
        heading: "4. 禁止事項",
        body: `以下の行為を禁止します:
• 違法な目的でのサービス利用
• 他者の権利を侵害するコンテンツのアップロード
• サービスへの不正アクセスの試み
• マルウェアやスパムの配布`,
      },
      {
        heading: "5. ユーザーコンテンツ",
        body: `Clipped で作成したすべてのコンテンツの所有権はお客様に帰属します。
お客様のメモや画像に対する権利を主張することはありません。
保存するコンテンツについてはお客様が責任を負います。`,
      },
      {
        heading: "6. サービスの可用性",
        body: "Clipped の継続的な提供に努めますが、中断のないサービスを保証するものではありません。メンテナンスやアップデートのため一時的に利用できない場合があります。",
      },
      {
        heading: "7. 責任の制限",
        body: "Clipped は「現状有姿」で提供され、いかなる保証も行いません。サービスの使用または使用不能に起因する損害（データ損失を含む）について、運営者は責任を負いません。",
      },
      {
        heading: "8. データの取り扱い",
        body: "データの取り扱いについては、プライバシーポリシーをご参照ください。サービスの利用により、プライバシーポリシーにも同意したものとみなされます。",
      },
      {
        heading: "9. 規約の変更",
        body: "本規約は随時更新される場合があります。変更はこのページに反映されます。変更後もサービスを継続利用することで、新しい規約に同意したものとみなされます。",
      },
      {
        heading: "10. お問い合わせ",
        body: "本利用規約に関するご質問は、fwjg2507@gmail.com までお問い合わせください。",
      },
    ],
  },
  zh: {
    title: "服务条款",
    lastUpdated: "最后更新：2026年3月15日",
    sections: [
      { heading: "1. 条款接受", body: "访问或使用 Clipped 即表示您同意受本服务条款的约束。如果您不同意，请勿使用本服务。" },
      { heading: "2. 服务说明", body: "Clipped 是一款笔记应用程序，允许您创建、编辑和组织笔记。本服务由个人开发者免费提供。" },
      { heading: "3. 用户账户", body: "您可以在没有账户的情况下使用 Clipped（数据存储在浏览器本地）。\n如果您选择使用 Google OAuth 登录，即表示同意提供准确的账户信息。\n您有责任维护账户的安全。" },
      { heading: "4. 可接受的使用", body: "您同意不会：\n• 将服务用于任何非法目的\n• 上传侵犯他人权利的内容\n• 试图未经授权访问服务\n• 使用服务传播恶意软件或垃圾邮件" },
      { heading: "5. 用户内容", body: "您保留在 Clipped 中创建的所有内容的所有权。\n我们不会对您的笔记或图片主张任何权利。\n您对存储的内容承担全部责任。" },
      { heading: "6. 服务可用性", body: "我们努力保持 Clipped 的可用性，但不保证服务不中断。服务可能因维护或更新而暂时不可用。" },
      { heading: "7. 责任限制", body: "Clipped 按「现状」提供，不提供任何形式的保证。运营者不对因使用或无法使用服务而产生的任何损害（包括数据丢失）承担责任。" },
      { heading: "8. 数据处理", body: "有关我们如何处理您的数据的详细信息，请参阅我们的隐私政策。使用本服务即表示您也同意我们的隐私政策。" },
      { heading: "9. 条款变更", body: "我们可能会不时更新这些条款。更改将反映在此页面上。变更后继续使用服务即表示接受新条款。" },
      { heading: "10. 联系方式", body: "如对本条款有疑问，请联系：fwjg2507@gmail.com" },
    ],
  },
  ko: {
    title: "이용약관",
    lastUpdated: "최종 업데이트: 2026년 3월 15일",
    sections: [
      { heading: "1. 약관 동의", body: "Clipped에 접속하거나 사용함으로써 본 이용약관에 동의하는 것으로 간주됩니다. 동의하지 않으시면 서비스를 이용하지 마세요." },
      { heading: "2. 서비스 설명", body: "Clipped는 메모를 작성, 편집, 정리할 수 있는 메모 애플리케이션입니다. 개인 개발자가 무료로 제공합니다." },
      { heading: "3. 사용자 계정", body: "계정 없이도 Clipped를 사용할 수 있습니다(데이터는 브라우저에 로컬 저장됩니다).\nGoogle OAuth로 로그인하는 경우 정확한 계정 정보를 제공하는 데 동의합니다.\n계정 보안 유지는 사용자의 책임입니다." },
      { heading: "4. 허용되는 사용", body: "다음 행위를 금지합니다:\n• 불법적인 목적으로 서비스 사용\n• 타인의 권리를 침해하는 콘텐츠 업로드\n• 서비스에 대한 무단 접근 시도\n• 악성 소프트웨어 또는 스팸 배포" },
      { heading: "5. 사용자 콘텐츠", body: "Clipped에서 작성한 모든 콘텐츠의 소유권은 사용자에게 있습니다.\n사용자의 메모나 이미지에 대한 권리를 주장하지 않습니다.\n저장하는 콘텐츠에 대한 책임은 사용자에게 있습니다." },
      { heading: "6. 서비스 가용성", body: "Clipped의 지속적인 제공을 위해 노력하지만, 중단 없는 서비스를 보장하지는 않습니다. 유지보수 또는 업데이트를 위해 일시적으로 사용할 수 없을 수 있습니다." },
      { heading: "7. 책임 제한", body: "Clipped는 '있는 그대로' 제공되며 어떠한 보증도 하지 않습니다. 서비스의 사용 또는 사용 불능으로 인한 손해(데이터 손실 포함)에 대해 운영자는 책임을 지지 않습니다." },
      { heading: "8. 데이터 처리", body: "데이터 처리에 대한 자세한 내용은 개인정보처리방침을 참조하세요. 서비스를 사용함으로써 개인정보처리방침에도 동의하는 것으로 간주됩니다." },
      { heading: "9. 약관 변경", body: "본 약관은 수시로 업데이트될 수 있습니다. 변경사항은 이 페이지에 반영됩니다. 변경 후 서비스를 계속 사용하면 새로운 약관에 동의한 것으로 간주됩니다." },
      { heading: "10. 문의", body: "본 이용약관에 관한 문의: fwjg2507@gmail.com" },
    ],
  },
  es: {
    title: "Términos de Servicio",
    lastUpdated: "Última actualización: 15 de marzo de 2026",
    sections: [
      { heading: "1. Aceptación de los términos", body: "Al acceder o utilizar Clipped, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo, no utilice el servicio." },
      { heading: "2. Descripción del servicio", body: "Clipped es una aplicación de notas que le permite crear, editar y organizar notas. El servicio es proporcionado gratuitamente por un desarrollador individual." },
      { heading: "3. Cuentas de usuario", body: "Puede usar Clipped sin una cuenta (los datos se almacenan localmente en su navegador).\nSi elige iniciar sesión con Google OAuth, acepta proporcionar información de cuenta precisa.\nUsted es responsable de mantener la seguridad de su cuenta." },
      { heading: "4. Uso aceptable", body: "Usted se compromete a no:\n• Usar el servicio para fines ilegales\n• Subir contenido que infrinja los derechos de otros\n• Intentar obtener acceso no autorizado al servicio\n• Usar el servicio para distribuir malware o spam" },
      { heading: "5. Contenido del usuario", body: "Usted conserva la propiedad de todo el contenido que crea en Clipped.\nNo reclamamos ningún derecho sobre sus notas o imágenes.\nUsted es el único responsable del contenido que almacena." },
      { heading: "6. Disponibilidad del servicio", body: "Nos esforzamos por mantener Clipped disponible, pero no garantizamos un servicio ininterrumpido. El servicio puede no estar disponible temporalmente por mantenimiento o actualizaciones." },
      { heading: "7. Limitación de responsabilidad", body: "Clipped se proporciona \"tal cual\" sin garantía de ningún tipo. El operador no será responsable de ningún daño derivado del uso o la imposibilidad de uso del servicio, incluyendo la pérdida de datos." },
      { heading: "8. Tratamiento de datos", body: "Consulte nuestra Política de Privacidad para obtener detalles sobre cómo manejamos sus datos. Al usar el servicio, también acepta nuestra Política de Privacidad." },
      { heading: "9. Cambios en los términos", body: "Podemos actualizar estos términos de vez en cuando. Los cambios se reflejarán en esta página. El uso continuado del servicio después de los cambios constituye la aceptación de los nuevos términos." },
      { heading: "10. Contacto", body: "Para preguntas sobre estos términos, contacte: fwjg2507@gmail.com" },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    lastUpdated: "Dernière mise à jour : 15 mars 2026",
    sections: [
      { heading: "1. Acceptation des conditions", body: "En accédant ou en utilisant Clipped, vous acceptez d'être lié par ces Conditions d'utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser le service." },
      { heading: "2. Description du service", body: "Clipped est une application de prise de notes qui vous permet de créer, modifier et organiser des notes. Le service est fourni gratuitement par un développeur individuel." },
      { heading: "3. Comptes utilisateurs", body: "Vous pouvez utiliser Clipped sans compte (les données sont stockées localement dans votre navigateur).\nSi vous choisissez de vous connecter via Google OAuth, vous acceptez de fournir des informations de compte exactes.\nVous êtes responsable de la sécurité de votre compte." },
      { heading: "4. Utilisation acceptable", body: "Vous vous engagez à ne pas :\n• Utiliser le service à des fins illégales\n• Télécharger du contenu portant atteinte aux droits d'autrui\n• Tenter d'obtenir un accès non autorisé au service\n• Utiliser le service pour distribuer des logiciels malveillants ou du spam" },
      { heading: "5. Contenu utilisateur", body: "Vous conservez la propriété de tout le contenu que vous créez dans Clipped.\nNous ne revendiquons aucun droit sur vos notes ou images.\nVous êtes seul responsable du contenu que vous stockez." },
      { heading: "6. Disponibilité du service", body: "Nous nous efforçons de maintenir Clipped disponible, mais nous ne garantissons pas un service ininterrompu. Le service peut être temporairement indisponible pour maintenance ou mises à jour." },
      { heading: "7. Limitation de responsabilité", body: "Clipped est fourni 'en l'état' sans aucune garantie. L'opérateur ne saurait être tenu responsable de tout dommage résultant de l'utilisation ou de l'impossibilité d'utiliser le service, y compris la perte de données." },
      { heading: "8. Traitement des données", body: "Veuillez consulter notre Politique de Confidentialité pour plus de détails sur le traitement de vos données. En utilisant le service, vous acceptez également notre Politique de Confidentialité." },
      { heading: "9. Modification des conditions", body: "Nous pouvons mettre à jour ces conditions de temps en temps. Les modifications seront reflétées sur cette page. L'utilisation continue du service après les modifications constitue l'acceptation des nouvelles conditions." },
      { heading: "10. Contact", body: "Pour toute question concernant ces conditions, contactez : fwjg2507@gmail.com" },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    lastUpdated: "Letzte Aktualisierung: 15. März 2026",
    sections: [
      { heading: "1. Annahme der Bedingungen", body: "Durch den Zugriff auf oder die Nutzung von Clipped stimmen Sie diesen Nutzungsbedingungen zu. Wenn Sie nicht einverstanden sind, nutzen Sie den Dienst bitte nicht." },
      { heading: "2. Dienstbeschreibung", body: "Clipped ist eine Notiz-Anwendung, mit der Sie Notizen erstellen, bearbeiten und organisieren können. Der Dienst wird von einem Einzelentwickler kostenlos bereitgestellt." },
      { heading: "3. Benutzerkonten", body: "Sie können Clipped ohne Konto nutzen (Daten werden lokal in Ihrem Browser gespeichert).\nWenn Sie sich über Google OAuth anmelden, stimmen Sie zu, korrekte Kontoinformationen anzugeben.\nSie sind für die Sicherheit Ihres Kontos verantwortlich." },
      { heading: "4. Akzeptable Nutzung", body: "Sie verpflichten sich, Folgendes zu unterlassen:\n• Nutzung des Dienstes für illegale Zwecke\n• Hochladen von Inhalten, die die Rechte anderer verletzen\n• Versuch, unbefugten Zugriff auf den Dienst zu erlangen\n• Nutzung des Dienstes zur Verbreitung von Malware oder Spam" },
      { heading: "5. Benutzerinhalte", body: "Sie behalten das Eigentum an allen Inhalten, die Sie in Clipped erstellen.\nWir erheben keine Ansprüche auf Ihre Notizen oder Bilder.\nSie sind allein verantwortlich für die von Ihnen gespeicherten Inhalte." },
      { heading: "6. Dienstverfügbarkeit", body: "Wir bemühen uns, Clipped verfügbar zu halten, garantieren jedoch keinen unterbrechungsfreien Dienst. Der Dienst kann vorübergehend für Wartung oder Updates nicht verfügbar sein." },
      { heading: "7. Haftungsbeschränkung", body: "Clipped wird \"wie besehen\" ohne jegliche Gewährleistung bereitgestellt. Der Betreiber haftet nicht für Schäden, die aus der Nutzung oder der Unmöglichkeit der Nutzung des Dienstes entstehen, einschließlich Datenverlust." },
      { heading: "8. Datenverarbeitung", body: "Einzelheiten zur Verarbeitung Ihrer Daten finden Sie in unserer Datenschutzerklärung. Mit der Nutzung des Dienstes stimmen Sie auch unserer Datenschutzerklärung zu." },
      { heading: "9. Änderungen der Bedingungen", body: "Wir können diese Bedingungen von Zeit zu Zeit aktualisieren. Änderungen werden auf dieser Seite widergespiegelt. Die fortgesetzte Nutzung des Dienstes nach Änderungen gilt als Annahme der neuen Bedingungen." },
      { heading: "10. Kontakt", body: "Bei Fragen zu diesen Nutzungsbedingungen kontaktieren Sie: fwjg2507@gmail.com" },
    ],
  },
};
