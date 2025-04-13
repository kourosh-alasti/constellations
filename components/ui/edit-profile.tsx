import EditProfileDialog from "@/components/ui/edit-profile-dialog";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditProfileButton() {
  const [open, setOpen] = useState(false);

  const user = {
    id: 1,
    firstName: "Kevin",
    lastName: "Nguyen",
    relation: "Family",
    image: null,
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative focus-visible:ring-0"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">Edit Profile</span>
      </Button>

      <EditProfileDialog open={open} onOpenChange={setOpen} user={user} />
    </>
  );
}
