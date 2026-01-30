"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface ConfirmDeleteProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function ConfirmDelete({
  open,
  onClose,
  onConfirm,
  loading = false,
}: ConfirmDeleteProps) {
  return (
    <Modal isOpen={open} onClose={onClose} backdrop="blur">
      <ModalContent>
        <ModalHeader className="text-danger">
          Delete transaction?
        </ModalHeader>

        <ModalBody className="text-sm text-foreground/70">
          This action cannot be undone. Are you sure you want to delete this
          transaction?
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="danger"
            onPress={onConfirm}
            isLoading={loading}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
