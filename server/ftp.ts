import * as ftp from "basic-ftp";
import { Readable } from "stream";

export interface CpanelConfig {
  host: string;
  username: string;
  password: string;
  port: number;
  remotePath: string;
  publicUrl: string;
}

export async function uploadToFtp(
  buffer: Buffer,
  filename: string,
  config: CpanelConfig
): Promise<string> {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: config.host,
      user: config.username,
      password: config.password,
      port: config.port || 21,
      secure: false,
    });

    const remotePath = config.remotePath.endsWith("/")
      ? config.remotePath
      : config.remotePath + "/";

    await client.ensureDir(remotePath);
    await client.cd(remotePath);

    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, filename);

    const base = config.publicUrl.replace(/\/$/, "");
    return `${base}/${filename}`;
  } finally {
    client.close();
  }
}
