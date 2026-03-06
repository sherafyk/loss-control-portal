import { google } from "googleapis";
import { Readable } from "stream";

let oauthClient: any = null;

function getOAuthClient() {
  if (oauthClient) return oauthClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID");
  if (!clientSecret) throw new Error("Missing GOOGLE_CLIENT_SECRET");
  if (!redirectUri) throw new Error("Missing GOOGLE_REDIRECT_URI");

  oauthClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (refreshToken) {
    oauthClient.setCredentials({
      refresh_token: refreshToken,
    });
  }

  return oauthClient;
}

function getDrive() {
  const auth = getOAuthClient();

  return google.drive({
    version: "v3",
    auth,
  });
}

export function getDriveFolderId() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");
  }

  return folderId;
}

export function driveFileWebViewLink(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
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
    fields: "id,name,webViewLink",
  });

  return res.data;
}

export async function getDriveFolderInfo(folderId?: string) {
  const drive = getDrive();
  const resolvedFolderId = folderId ?? getDriveFolderId();

  const res = await drive.files.get({
    fileId: resolvedFolderId,
    fields: "id,name,mimeType,driveId,parents",
  });

  return res.data;
}