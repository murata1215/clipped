/**
 * プライバシーポリシーの多言語コンテンツ
 *
 * 英語をカノニカルとし、各言語の翻訳を提供する。
 * Google OAuth 本番審査用。
 */
import type { Locale } from "@/locales";

export const privacyContent: Record<Locale, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 15, 2026",
    sections: [
      {
        heading: "1. Operator",
        body: `Service name: Clipped
Operator: Keisuke (individual developer)
Contact: fwjg2507@gmail.com`,
      },
      {
        heading: "2. Information We Collect",
        body: `When you log in with Google OAuth, we collect:
• Google account name — used as your display name
• Email address — used for account identification
• Profile picture URL — used for avatar display

When you use the service, we store:
• Note data (text and images) — for providing the service`,
      },
      {
        heading: "3. Where Data Is Stored",
        body: `• Not logged in: Your data is stored in your browser's localStorage (on your device only). We have no access to this data.
• Logged in: Your data is stored on our server (PostgreSQL database and file storage).`,
      },
      {
        heading: "4. Third-Party Sharing",
        body: "We do not share your data with any third parties. Your data is not transmitted externally except through the Google OAuth authentication flow.",
      },
      {
        heading: "5. Cookies",
        body: "We use cookies only for session management via NextAuth.js. We do not use tracking cookies or third-party analytics cookies.",
      },
      {
        heading: "6. Data Deletion",
        body: "You can freely delete your notes within the app. If you wish to delete your entire account, please contact us at the email address above.",
      },
      {
        heading: "7. Security",
        body: "All communication is encrypted via HTTPS. We do not store passwords — authentication is handled entirely through Google OAuth.",
      },
      {
        heading: "8. Changes to This Policy",
        body: "We may update this policy from time to time. Changes will be reflected on this page. Significant changes will be announced within the service.",
      },
      {
        heading: "9. Contact",
        body: "For questions or concerns about this privacy policy, please contact: fwjg2507@gmail.com",
      },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    lastUpdated: "最終更新日: 2026年3月15日",
    sections: [
      {
        heading: "1. 運営者情報",
        body: `サービス名: Clipped
運営者: けいすけ（個人開発）
連絡先: fwjg2507@gmail.com`,
      },
      {
        heading: "2. 取得する情報",
        body: `Google OAuth でログインした際に以下の情報を取得します:
• Google アカウント名 — ユーザー表示名として使用
• メールアドレス — アカウント識別に使用
• プロフィール画像 URL — アバター表示に使用

サービス利用時に以下を保存します:
• メモデータ（テキスト・画像） — サービス提供のため`,
      },
      {
        heading: "3. データの保存場所",
        body: `• 未ログイン: データはブラウザの localStorage に保存されます（端末内のみ）。運営者はアクセスできません。
• ログイン済み: データはサーバー（PostgreSQL データベースおよびファイルストレージ）に保存されます。`,
      },
      {
        heading: "4. 第三者提供",
        body: "お客様のデータを第三者に提供することはありません。Google OAuth の認証フロー以外で外部にデータを送信することはありません。",
      },
      {
        heading: "5. Cookie の使用",
        body: "NextAuth.js によるセッション管理のみに Cookie を使用しています。トラッキング目的の Cookie やサードパーティの分析 Cookie は使用していません。",
      },
      {
        heading: "6. データの削除",
        body: "アプリ内でメモを自由に削除できます。アカウント全体の削除を希望される場合は、上記連絡先までご連絡ください。",
      },
      {
        heading: "7. セキュリティ",
        body: "すべての通信は HTTPS で暗号化されています。パスワードは保持しません。認証は Google OAuth を通じてのみ行われます。",
      },
      {
        heading: "8. ポリシーの変更",
        body: "本ポリシーは随時更新される場合があります。変更はこのページに反映されます。重要な変更はサービス内で通知します。",
      },
      {
        heading: "9. お問い合わせ",
        body: "本プライバシーポリシーに関するご質問は、fwjg2507@gmail.com までお問い合わせください。",
      },
    ],
  },
  zh: {
    title: "隐私政策",
    lastUpdated: "最后更新：2026年3月15日",
    sections: [
      { heading: "1. 运营者", body: "服务名称：Clipped\n运营者：Keisuke（个人开发者）\n联系方式：fwjg2507@gmail.com" },
      { heading: "2. 收集的信息", body: "通过 Google OAuth 登录时，我们收集：\n• Google 账户名 — 用作显示名称\n• 电子邮件地址 — 用于账户识别\n• 个人头像 URL — 用于头像显示\n\n使用服务时，我们存储：\n• 笔记数据（文字和图片） — 用于提供服务" },
      { heading: "3. 数据存储位置", body: "• 未登录：数据存储在浏览器的 localStorage 中（仅在您的设备上）。我们无法访问。\n• 已登录：数据存储在我们的服务器上（PostgreSQL 数据库和文件存储）。" },
      { heading: "4. 第三方共享", body: "我们不会与任何第三方共享您的数据。除 Google OAuth 认证流程外，不会向外部传输数据。" },
      { heading: "5. Cookie", body: "我们仅使用 Cookie 进行 NextAuth.js 会话管理。不使用跟踪 Cookie 或第三方分析 Cookie。" },
      { heading: "6. 数据删除", body: "您可以在应用内自由删除笔记。如需删除整个账户，请通过上述邮箱联系我们。" },
      { heading: "7. 安全性", body: "所有通信通过 HTTPS 加密。我们不存储密码，认证完全通过 Google OAuth 进行。" },
      { heading: "8. 政策变更", body: "我们可能会不时更新本政策。更改将反映在此页面上。重大变更将在服务内公告。" },
      { heading: "9. 联系方式", body: "如对本隐私政策有疑问，请联系：fwjg2507@gmail.com" },
    ],
  },
  ko: {
    title: "개인정보처리방침",
    lastUpdated: "최종 업데이트: 2026년 3월 15일",
    sections: [
      { heading: "1. 운영자", body: "서비스명: Clipped\n운영자: Keisuke (개인 개발자)\n연락처: fwjg2507@gmail.com" },
      { heading: "2. 수집하는 정보", body: "Google OAuth로 로그인 시 다음 정보를 수집합니다:\n• Google 계정 이름 — 표시 이름으로 사용\n• 이메일 주소 — 계정 식별에 사용\n• 프로필 사진 URL — 아바타 표시에 사용\n\n서비스 이용 시 저장되는 정보:\n• 메모 데이터(텍스트 및 이미지) — 서비스 제공 목적" },
      { heading: "3. 데이터 저장 위치", body: "• 비로그인: 데이터는 브라우저의 localStorage에 저장됩니다(기기 내에서만). 운영자는 접근할 수 없습니다.\n• 로그인: 데이터는 서버(PostgreSQL 데이터베이스 및 파일 스토리지)에 저장됩니다." },
      { heading: "4. 제3자 제공", body: "귀하의 데이터를 제3자와 공유하지 않습니다. Google OAuth 인증 흐름 외에 외부로 데이터를 전송하지 않습니다." },
      { heading: "5. 쿠키", body: "NextAuth.js를 통한 세션 관리에만 쿠키를 사용합니다. 추적 쿠키나 제3자 분석 쿠키는 사용하지 않습니다." },
      { heading: "6. 데이터 삭제", body: "앱 내에서 메모를 자유롭게 삭제할 수 있습니다. 전체 계정 삭제를 원하시면 위 이메일로 연락해 주세요." },
      { heading: "7. 보안", body: "모든 통신은 HTTPS로 암호화됩니다. 비밀번호는 저장하지 않으며, 인증은 전적으로 Google OAuth를 통해 이루어집니다." },
      { heading: "8. 정책 변경", body: "본 정책은 수시로 업데이트될 수 있습니다. 변경사항은 이 페이지에 반영됩니다. 중요한 변경은 서비스 내에서 공지합니다." },
      { heading: "9. 문의", body: "본 개인정보처리방침에 관한 문의: fwjg2507@gmail.com" },
    ],
  },
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Última actualización: 15 de marzo de 2026",
    sections: [
      { heading: "1. Operador", body: "Nombre del servicio: Clipped\nOperador: Keisuke (desarrollador individual)\nContacto: fwjg2507@gmail.com" },
      { heading: "2. Información que recopilamos", body: "Al iniciar sesión con Google OAuth, recopilamos:\n• Nombre de cuenta de Google — usado como nombre de visualización\n• Dirección de correo electrónico — usada para identificación de cuenta\n• URL de foto de perfil — usada para mostrar avatar\n\nAl usar el servicio, almacenamos:\n• Datos de notas (texto e imágenes) — para proporcionar el servicio" },
      { heading: "3. Dónde se almacenan los datos", body: "• Sin iniciar sesión: Sus datos se almacenan en el localStorage del navegador (solo en su dispositivo). No tenemos acceso.\n• Con sesión iniciada: Sus datos se almacenan en nuestro servidor (base de datos PostgreSQL y almacenamiento de archivos)." },
      { heading: "4. Compartir con terceros", body: "No compartimos sus datos con terceros. Sus datos no se transmiten externamente excepto a través del flujo de autenticación de Google OAuth." },
      { heading: "5. Cookies", body: "Usamos cookies solo para la gestión de sesiones a través de NextAuth.js. No usamos cookies de rastreo ni cookies de análisis de terceros." },
      { heading: "6. Eliminación de datos", body: "Puede eliminar libremente sus notas dentro de la aplicación. Si desea eliminar toda su cuenta, contáctenos por correo electrónico." },
      { heading: "7. Seguridad", body: "Toda la comunicación está cifrada mediante HTTPS. No almacenamos contraseñas — la autenticación se realiza completamente a través de Google OAuth." },
      { heading: "8. Cambios en esta política", body: "Podemos actualizar esta política de vez en cuando. Los cambios se reflejarán en esta página. Los cambios significativos se anunciarán dentro del servicio." },
      { heading: "9. Contacto", body: "Para preguntas sobre esta política de privacidad, contacte: fwjg2507@gmail.com" },
    ],
  },
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour : 15 mars 2026",
    sections: [
      { heading: "1. Opérateur", body: "Nom du service : Clipped\nOpérateur : Keisuke (développeur individuel)\nContact : fwjg2507@gmail.com" },
      { heading: "2. Informations collectées", body: "Lors de la connexion via Google OAuth, nous collectons :\n• Nom du compte Google — utilisé comme nom d'affichage\n• Adresse e-mail — utilisée pour l'identification du compte\n• URL de la photo de profil — utilisée pour l'affichage de l'avatar\n\nLors de l'utilisation du service, nous stockons :\n• Données de notes (texte et images) — pour fournir le service" },
      { heading: "3. Lieu de stockage des données", body: "• Non connecté : Vos données sont stockées dans le localStorage de votre navigateur (sur votre appareil uniquement). Nous n'y avons pas accès.\n• Connecté : Vos données sont stockées sur notre serveur (base de données PostgreSQL et stockage de fichiers)." },
      { heading: "4. Partage avec des tiers", body: "Nous ne partageons pas vos données avec des tiers. Vos données ne sont pas transmises à l'extérieur sauf via le flux d'authentification Google OAuth." },
      { heading: "5. Cookies", body: "Nous utilisons des cookies uniquement pour la gestion de session via NextAuth.js. Nous n'utilisons pas de cookies de suivi ni de cookies d'analyse tiers." },
      { heading: "6. Suppression des données", body: "Vous pouvez librement supprimer vos notes dans l'application. Si vous souhaitez supprimer votre compte entier, veuillez nous contacter par e-mail." },
      { heading: "7. Sécurité", body: "Toutes les communications sont chiffrées via HTTPS. Nous ne stockons pas de mots de passe — l'authentification est entièrement gérée via Google OAuth." },
      { heading: "8. Modifications de cette politique", body: "Nous pouvons mettre à jour cette politique de temps en temps. Les modifications seront reflétées sur cette page. Les changements importants seront annoncés au sein du service." },
      { heading: "9. Contact", body: "Pour toute question concernant cette politique de confidentialité, contactez : fwjg2507@gmail.com" },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    lastUpdated: "Letzte Aktualisierung: 15. März 2026",
    sections: [
      { heading: "1. Betreiber", body: "Dienstname: Clipped\nBetreiber: Keisuke (Einzelentwickler)\nKontakt: fwjg2507@gmail.com" },
      { heading: "2. Erfasste Informationen", body: "Bei der Anmeldung über Google OAuth erfassen wir:\n• Google-Kontoname — als Anzeigename verwendet\n• E-Mail-Adresse — zur Kontoidentifikation\n• Profilbild-URL — zur Avatar-Anzeige\n\nBei der Nutzung des Dienstes speichern wir:\n• Notizdaten (Text und Bilder) — zur Bereitstellung des Dienstes" },
      { heading: "3. Speicherort der Daten", body: "• Nicht angemeldet: Ihre Daten werden im localStorage des Browsers gespeichert (nur auf Ihrem Gerät). Wir haben keinen Zugriff.\n• Angemeldet: Ihre Daten werden auf unserem Server gespeichert (PostgreSQL-Datenbank und Dateispeicher)." },
      { heading: "4. Weitergabe an Dritte", body: "Wir geben Ihre Daten nicht an Dritte weiter. Ihre Daten werden nicht extern übertragen, außer über den Google OAuth-Authentifizierungsablauf." },
      { heading: "5. Cookies", body: "Wir verwenden Cookies ausschließlich für die Sitzungsverwaltung über NextAuth.js. Wir verwenden keine Tracking-Cookies oder Analyse-Cookies von Drittanbietern." },
      { heading: "6. Datenlöschung", body: "Sie können Ihre Notizen in der App frei löschen. Wenn Sie Ihr gesamtes Konto löschen möchten, kontaktieren Sie uns bitte per E-Mail." },
      { heading: "7. Sicherheit", body: "Alle Kommunikation wird über HTTPS verschlüsselt. Wir speichern keine Passwörter — die Authentifizierung erfolgt vollständig über Google OAuth." },
      { heading: "8. Änderungen dieser Richtlinie", body: "Wir können diese Richtlinie von Zeit zu Zeit aktualisieren. Änderungen werden auf dieser Seite widergespiegelt. Wesentliche Änderungen werden innerhalb des Dienstes angekündigt." },
      { heading: "9. Kontakt", body: "Bei Fragen zu dieser Datenschutzerklärung kontaktieren Sie: fwjg2507@gmail.com" },
    ],
  },
};
