"use client";

import { useTRPC } from "@/trpc/client";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

type Requirement = {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  appliesToStates: string[] | null;
  sortOrder: number;
};

function RequirementRow({
  requirement,
  onSave,
  onDelete,
  isSaving: isParentSaving,
}: {
  requirement: Requirement;
  onSave: (data: {
    id: string;
    name: string;
    description?: string;
    required: boolean;
    appliesToStates?: string[];
  }) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(requirement.name);
  const [description, setDescription] = useState(
    requirement.description ?? "",
  );
  const [required, setRequired] = useState(requirement.required);
  const [stateInput, setStateInput] = useState("");
  const [states, setStates] = useState<string[]>(
    requirement.appliesToStates ?? [],
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddState = () => {
    const code = stateInput.trim().toUpperCase();
    if (code && US_STATES.includes(code) && !states.includes(code)) {
      setStates([...states, code]);
      setStateInput("");
    } else if (code && !US_STATES.includes(code)) {
      toast({
        title: "Invalid state code",
        description: `"${code}" is not a valid US state code.`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveState = (code: string) => {
    setStates(states.filter((s) => s !== code));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Requirement name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    onSave({
      id: requirement.id,
      name: name.trim(),
      description: description.trim() || undefined,
      required,
      appliesToStates: states.length > 0 ? states : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(requirement.name);
    setDescription(requirement.description ?? "");
    setRequired(requirement.required);
    setStates(requirement.appliesToStates ?? []);
    setIsEditing(false);
  };

  if (showDeleteConfirm) {
    return (
      <div className="border rounded-md p-4 bg-destructive/5 space-y-3">
        <p className="text-sm font-medium">
          Delete "{requirement.name}"?
        </p>
        <p className="text-xs text-muted-foreground">
          This will remove the requirement. Existing documents already uploaded
          against it will not be affected.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              onDelete(requirement.id);
              setShowDeleteConfirm(false);
            }}
            disabled={isParentSaving}
          >
            Delete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="border rounded-md p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bank Statements"
            className="max-w-[400px]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Last 3 months of business bank statements"
            className="max-w-[400px]"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={required}
            onCheckedChange={setRequired}
            id={`required-${requirement.id}`}
          />
          <Label htmlFor={`required-${requirement.id}`} className="text-xs">
            Required
          </Label>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">
            State Overrides{" "}
            <span className="text-muted-foreground font-normal">
              (leave empty to apply to all states)
            </span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              placeholder="e.g. NY"
              className="max-w-[100px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddState();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddState}
            >
              Add
            </Button>
          </div>
          {states.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {states.map((code) => (
                <Badge
                  key={code}
                  variant="tag-rounded"
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => handleRemoveState(code)}
                >
                  {code} &times;
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleSave} disabled={isParentSaving}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 flex items-center justify-between group">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{requirement.name}</span>
          {requirement.required ? (
            <Badge variant="default" className="text-[10px]">
              Required
            </Badge>
          ) : (
            <Badge variant="tag" className="text-[10px]">
              Optional
            </Badge>
          )}
        </div>
        {requirement.description && (
          <p className="text-xs text-muted-foreground">
            {requirement.description}
          </p>
        )}
        {requirement.appliesToStates &&
          requirement.appliesToStates.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {requirement.appliesToStates.map((code) => (
                <Badge key={code} variant="tag-rounded" className="text-[10px]">
                  {code}
                </Badge>
              ))}
            </div>
          )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function AddRequirementForm({
  onAdd,
  isAdding,
}: {
  onAdd: (data: { name: string; description?: string; required: boolean }) => void;
  isAdding: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState(true);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Requirement name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      required,
    });
    setName("");
    setDescription("");
    setRequired(true);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Add Requirement
      </Button>
    );
  }

  return (
    <div className="border rounded-md p-4 space-y-4 border-dashed">
      <div className="space-y-2">
        <Label className="text-xs">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Voided Check"
          className="max-w-[400px]"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Voided check for the business bank account"
          className="max-w-[400px]"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={required}
          onCheckedChange={setRequired}
          id="new-req-required"
        />
        <Label htmlFor="new-req-required" className="text-xs">
          Required
        </Label>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={isAdding}>
          Add
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function UnderwritingRequirementsEditor() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: requirements } = useSuspenseQuery(
    trpc.underwritingApplications.getRequirements.queryOptions(),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.underwritingApplications.getRequirements.queryKey(),
    });
  };

  const upsertMutation = useMutation(
    trpc.underwritingApplications.upsertRequirement.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast({
          title: "Saved",
          description: "Requirement updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.underwritingApplications.deleteRequirement.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast({
          title: "Deleted",
          description: "Requirement removed.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    }),
  );

  const seedMutation = useMutation(
    trpc.underwritingApplications.seedDefaults.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast({
          title: "Defaults restored",
          description: "Default document requirements have been added.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    }),
  );

  const handleSave = (data: {
    id: string;
    name: string;
    description?: string;
    required: boolean;
    appliesToStates?: string[];
  }) => {
    upsertMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleAdd = (data: {
    name: string;
    description?: string;
    required: boolean;
  }) => {
    upsertMutation.mutate(data);
  };

  const isSaving = upsertMutation.isPending || deleteMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Requirements</CardTitle>
        <CardDescription>
          Configure which documents merchants must provide during underwriting.
          You can set state-specific requirements using state overrides.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {requirements && requirements.length > 0 ? (
            requirements.map((req: Requirement) => (
              <RequirementRow
                key={req.id}
                requirement={req}
                onSave={handleSave}
                onDelete={handleDelete}
                isSaving={isSaving}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No document requirements configured. Add requirements or reset to
              defaults.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
        >
          {seedMutation.isPending ? "Resetting..." : "Reset to Defaults"}
        </Button>
        <AddRequirementForm onAdd={handleAdd} isAdding={upsertMutation.isPending} />
      </CardFooter>
    </Card>
  );
}
