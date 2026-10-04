import type { CommentPage, PublicComment, Receipt } from "@/domain/schemas";
export type Resource = "Orders" | "Inquiries" | "Comments";
export interface StoredOrder {
  requestId: string;
  createdAt: string;
  status: "received";
  buyer: { name: string; phone: string; email: string };
  recipient: { name: string; phone: string };
  address: string;
  notes: string;
  items: ReturnType<typeof import("@/domain/pricing").snapshotItems>;
  totals: ReturnType<typeof import("@/domain/pricing").summarize>;
  shipping: "pending";
}
export interface WriteContext {
  requestId: string;
  payloadHash: string;
  rateKey: string;
  replayed?: boolean;
}
export interface OrderRepository {
  existingOrder(context: WriteContext): Promise<Receipt | null>;
  saveOrder(order: StoredOrder, context: WriteContext): Promise<Receipt>;
}
export interface InquiryRepository {
  existingInquiry(context: WriteContext): Promise<Receipt | null>;
  saveInquiry(
    inquiry: import("@/domain/schemas").InquiryInput & {
      createdAt: string;
      status: "received";
    },
    context: WriteContext,
  ): Promise<Receipt>;
}
export interface CommentRepository {
  saveComment(
    comment: import("@/domain/schemas").CommentInput,
    context: WriteContext,
  ): Promise<PublicComment>;
  listComments(postId: string, cursor: string | null): Promise<CommentPage>;
}
export type Repositories = OrderRepository &
  InquiryRepository &
  CommentRepository;
