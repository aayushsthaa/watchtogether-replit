import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown } from "lucide-react";
import type { Participant } from "@/lib/schema";

interface OwnershipTransferProps {
  participants: Participant[];
  currentOwnerId: string;
  onTransfer?: (newOwnerId: string) => void;
}

export function OwnershipTransfer({
  participants,
  currentOwnerId,
  onTransfer,
}: OwnershipTransferProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [open, setOpen] = useState(false);

  const eligibleParticipants = participants.filter(
    (p) => p.userId !== currentOwnerId
  );

  const handleTransfer = () => {
    if (selectedUserId) {
      onTransfer?.(selectedUserId);
      setOpen(false);
      setSelectedUserId("");
    }
  };

  if (eligibleParticipants.length === 0) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="button-transfer-ownership"
        >
          <Crown className="mr-1 h-4 w-4" />
          Transfer Ownership
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="dialog-transfer-ownership">
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer Room Ownership</AlertDialogTitle>
          <AlertDialogDescription>
            Select a participant to become the new room owner. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger data-testid="select-new-owner">
              <SelectValue placeholder="Select new owner" />
            </SelectTrigger>
            <SelectContent>
              {eligibleParticipants.map((participant) => (
                <SelectItem
                  key={participant.userId}
                  value={participant.userId}
                  data-testid={`select-option-${participant.userId}`}
                >
                  {participant.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-transfer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleTransfer}
            disabled={!selectedUserId}
            data-testid="button-confirm-transfer"
          >
            Transfer Ownership
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
