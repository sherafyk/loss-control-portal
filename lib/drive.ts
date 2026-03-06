import { google } from "googleapis";
import { Readable } from "stream";

function getServiceAccountCredentials() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  if (!encoded) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  return JSON.parse(decoded);
}

function getDrive() {
  const credentials = getServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

export function getDriveFolderId() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");
  }

  return folderId;
}

export async function uploadToDrive(params: {
  folderId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const drive = getDrive();

  const res = await drive.files.create({
    requestBody: {
      name: params.fileName,
      parents: [params.folderId],
    },
    media: {
      mimeType: params.mimeType,
      body: Readable.from(params.buffer),
    },
    fields: "id,name,webViewLink,driveId,parents",
    supportsAllDrives: true,
  });

  return res.data;
}

export async function getDriveFolderInfo(folderId?: string) {
  const drive = getDrive();
  const resolvedFolderId = folderId ?? getDriveFolderId();

  const res = await drive.files.get({
    fileId: resolvedFolderId,
    fields: "id,name,mimeType,driveId,parents",
    supportsAllDrives: true,
  });

  return res.data;
}