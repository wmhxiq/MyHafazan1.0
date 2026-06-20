import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

export const spacesClient = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: 'sgp1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false, // Important for DigitalOcean Spaces (deepseek bagi)
})

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  await spacesClient.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: fileName,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    })
  )

  return `${process.env.DO_SPACES_CDN_URL}/${fileName}`
}