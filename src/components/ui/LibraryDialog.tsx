"use client";
import {
  ModalOverlay,
  Modal,
  Dialog,
} from "@/components/untitled/application/modals/modal";
import { Heading } from "react-aria-components";
import { useId } from "react";
import { Button } from "@/components/untitled/base/buttons/button";
export function LibraryDialog({
  open,
  close,
  children,
  title = "Thư viện ảnh Hòe",
  busy = false,
}: {
  open: boolean;
  close: () => void;
  children: React.ReactNode;
  title?: string;
  busy?: boolean;
}) {
  const id = useId();
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
    >
      <Modal className="sm:max-w-3xl">
        <Dialog aria-labelledby={id}>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <Heading
                slot="title"
                id={id}
                className="text-display-xs font-semibold"
              >
                {title}
              </Heading>
              <Button size="md" color="secondary" isDisabled={busy} onPress={close}>
                Đóng
              </Button>
            </div>
            {children}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
