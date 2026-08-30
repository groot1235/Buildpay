import { Metadata } from "next";
import UploadClient from "./upload-client";

export const metadata: Metadata = {
  title: "Upload Statement",
  description: "Import bank statement CSV ledger statements for automated reconciliation checks.",
};

export default function UploadPage() {
  return <UploadClient />;
}
