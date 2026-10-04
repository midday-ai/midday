import {
  completeUploadsSchema,
  createUploadUrlsSchema,
} from "@api/schemas/storage";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  authorizeCompletedKey,
  authorizeUploadFolder,
  authorizeUploadKey,
  canonicalContentType,
  enforceMimeAndSize,
  maxUploadBytes,
} from "@api/utils/upload-policy";
import {
  createUploadReceipt,
  verifyUploadReceipt,
} from "@api/utils/upload-receipt";
import {
  getTransactionById,
  upsertDocumentForObject,
} from "@midday/db/queries";
import {
  createSignedUploadUrl,
  getPublicUrl,
  head,
  remove,
} from "@midday/storage";
import { isLocalBackend } from "@midday/utils/backend";
import { TRPCError } from "@trpc/server";

export const storageRouter = createTRPCRouter({
  createUploadUrls: protectedProcedure
    .input(createUploadUrlsSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isLocalBackend())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use Supabase uploads for the selected backend",
        });
      const owner = { teamId: ctx.teamId ?? null, userId: ctx.session.user.id };
      return Promise.all(
        input.files.map(async (file) => {
          const contentType = enforceMimeAndSize(
            input.bucket,
            file.contentType,
            file.size,
          );
          const transactionId = authorizeUploadFolder(
            input.bucket,
            file.path,
            owner,
          );
          if (
            transactionId &&
            !(await getTransactionById(ctx.db, {
              id: transactionId,
              teamId: ctx.teamId!,
            }))
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Transaction is not in this team",
            });
          }
          const key = authorizeUploadKey(
            input.bucket,
            file.path,
            file.filename,
            owner,
            contentType,
          );
          const receipt = await createUploadReceipt(
            {
              bucket: input.bucket,
              key,
              teamId: ctx.teamId ?? null,
              size: file.size,
              contentType,
            },
            owner.userId,
          );
          const signed = await createSignedUploadUrl(input.bucket, key, {
            contentType,
            expiresIn: 600,
          });
          return { key, ...signed, receipt };
        }),
      );
    }),
  completeUploads: protectedProcedure
    .input(completeUploadsSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isLocalBackend())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use Supabase uploads for the selected backend",
        });
      const owner = { teamId: ctx.teamId ?? null, userId: ctx.session.user.id };
      // Verify every receipt before accessing or mutating any object in this batch.
      const files = await Promise.all(
        input.files.map(async (file) => {
          const claims = await verifyUploadReceipt(file.receipt, {
            ...owner,
            bucket: input.bucket,
            key: file.key,
          });
          const transactionId = authorizeCompletedKey(
            input.bucket,
            file.key,
            owner,
          );
          if (
            transactionId &&
            !(await getTransactionById(ctx.db, {
              id: transactionId,
              teamId: ctx.teamId!,
            }))
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Transaction is not in this team",
            });
          }
          return { ...file, claims };
        }),
      );
      return Promise.all(
        files.map(async ({ key, claims }) => {
          const object = await head(input.bucket, key);
          if (!object)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Uploaded object was not found",
            });
          if (object.size > maxUploadBytes(input.bucket)) {
            await remove(input.bucket, [key]);
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Uploaded file exceeds the size limit",
            });
          }
          let contentType: string;
          try {
            contentType = enforceMimeAndSize(
              input.bucket,
              object.contentType ?? "",
              object.size,
            );
            if (
              object.size !== claims.size ||
              canonicalContentType(contentType) !== claims.contentType
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Uploaded file does not match the authorized upload",
              });
            }
          } catch (error) {
            await remove(input.bucket, [key]);
            throw error;
          }
          if (input.bucket === "vault") {
            await upsertDocumentForObject(ctx.db, {
              teamId: ctx.teamId!,
              key,
              ownerId: owner.userId,
              size: object.size,
              mimetype: contentType,
            });
            return { key, publicUrl: null };
          }
          return { key, publicUrl: getPublicUrl(input.bucket, key) };
        }),
      );
    }),
});
