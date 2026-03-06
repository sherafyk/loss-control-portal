import { google } from "googleapis";
import { Readable } from "stream";

let oauthClient: any = null;

function getOAuthClient() {
  if (oauthClient) return oauthClient;

  oauthClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauthClient.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  return oauthClient;
}

export function getDriveFolderId() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");
  }

  return folderId;
}

function getDrive() {
  const auth = getOAuthClient();

  return google.drive({
    version: "v3",
    auth,
  });
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