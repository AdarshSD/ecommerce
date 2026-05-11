"use client";

import { StoreConfig } from "@/lib/api/config";
import StoreNav from "./StoreNav";
import StoreFooter from "./StoreFooter";
import CartDrawer from "./CartDrawer";
import ToastContainer from "@/components/ui/ToastContainer";

interface Props {
  config: StoreConfig | null;
  children: React.ReactNode;
}

export default function StoreShell({ config, children }: Props) {
  return (
    <>
      <StoreNav config={config} />
      <main className="flex-1">{children}</main>
      <StoreFooter config={config} />
      <CartDrawer config={config} />
      <ToastContainer />
    </>
  );
}
