"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";

type DeleteActionProps = {
  handleDeleteSubmit: () => void | Promise<void>;
  isLoading?: boolean;
  /** Controlled: pass both open and onOpenChange (e.g. open from menu) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Uncontrolled: custom trigger (default: trash icon) */
  trigger?: ReactNode;
};

const DeleteAction: React.FC<DeleteActionProps> = ({
  handleDeleteSubmit,
  isLoading,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const handleDelete = useCallback(async () => {
    try {
      await handleDeleteSubmit();
      setOpen(false);
    } catch (err: unknown) {
      console.error(err);
      if (
        err &&
        typeof err === "object" &&
        "errors" in err &&
        Array.isArray((err as { errors?: unknown }).errors)
      ) {
        for (const key of (err as { errors: unknown[] }).errors) {
          console.error(key);
        }
      }
    }
  }, [handleDeleteSubmit, setOpen]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <AlertDialogTrigger asChild>
          {trigger ?? (
            <button
              type="button"
              className="cursor-pointer p-1 hover:bg-red-500/20 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
            </button>
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="bg-background border border-border text-foreground max-w-[min(100vw-2rem,380px)] p-3 sm:p-4">
        <AlertDialogTitle className="sr-only">Delete Confirmation</AlertDialogTitle>
        <AlertDialogDescription className="sr-only">
          Confirm permanent deletion
        </AlertDialogDescription>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-red-500/10 p-2 sm:p-3 rounded-full">
              <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-1 sm:mb-2">
              Are you sure?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outlineBtn"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleDelete}
              variant="primarybtn"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAction;
