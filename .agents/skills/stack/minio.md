# Skill: MinIO (S3-compatible object storage)

Load when: keywords upload/bucket/object/presigned/file storage. Assumes core/* loaded.

## Docker service (source of truth: `docker-compose.yml`)
- **Image**: `minio/minio:latest` · **Service**: `minio`
- **S3 API**: `http://minio:9000` (internal) / `http://localhost:9000` (host)
- **Console UI**: `http://localhost:9001`
- **Credentials**: access key `berdikari`, secret `secret123`, bucket `berdikari`
- Laravel config: `AWS_USE_PATH_STYLE_ENDPOINT=true`, `AWS_ENDPOINT=http://minio:9000`.
- Never reference `localhost:9000` from inside the API container — use `http://minio:9000`.

## Evidence
- Filesystem disk config (`config/filesystems.php`) → driver s3, endpoint, bucket.
- Upload path: controller → `Storage::disk()->put()`; URL generation (presigned vs public).
- Access failures: bucket policy, endpoint/region, path-style vs virtual-host addressing.

## Common causes
Wrong endpoint/region, path-style addressing needed for MinIO, missing bucket, ACL/policy, broken presigned expiry, wrong disk in code.

## Do not
Load for unrelated storage questions (DB persistence → `database`).
