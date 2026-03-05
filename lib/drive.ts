import { google } from "googleapis";
import { Readable } from "stream";

type DriveUploadResult = {
  id: string;
  name: string;
  webViewLink?: string;
};

function getServiceAccountCredentials(): { client_email: string; private_key: string } {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!b64) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 env var.");
  }
  const json = Buffer.from(b64, "base64").toString("utf8");
  const creds = JSON.parse(json);

  if (!creds.client_email || !creds.private_key) {
    throw new Error("Service account JSON must include client_email and private_key.");
  }

  return { client_email: creds.client_email, private_key: creds.private_key };
}

function getDrive() {
  const { client_email, private_key } = getServiceAccountCredentials();

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ["https://www.googleapis.com/auth/drive"]
  });

  return google.drive({ version: "v3", auth });
}

export async function uploadToDrive(params: {
  folderId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<DriveUploadResult> {
  const drive = getDrive();

  const res = await drive.files.create({
    requestBody: {
      name: params.fileName,
      parents: [params.folderId]
    },
    media: {
      mimeType: params.mimeType,
      body: Readable.from(params.buffer)
    },
    fields: "id,name,webViewLink"
  });

  if (!res.data.id || !res.data.name) {
    throw new Error("Google Drive upload failed (missing id/name).");
  }

  return {
    id: res.data.id,
    name: res.data.name,
    webViewLink: res.data.webViewLink ?? undefined
  };
}

export function getDriveFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID env var.");
  }
  return folderId;
}

export function driveFileWebViewLink(fileId: string): string {
  // Works for most Drive files as long as viewer has permissions.
  return `https://drive.google.com/file/d/${fileId}/view`;
}
