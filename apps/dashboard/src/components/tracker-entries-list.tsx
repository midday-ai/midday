import { updateEntriesAction } from "@/actions/project/update-entries-action";
import { useOptimisticAction } from "next-safe-action/hooks";
import { UpdateRecordForm } from "./forms/update-record.form";

export function TrackerEntriesList({ data }) {
  const { execute: updateEntries, optimisticData } = useOptimisticAction(
    updateEntriesAction,
    data,
    (state, { action, ...payload }) => {
      switch (action) {
        case "update":
          return data.map((item) => {
            if (item.id === payload.id) {
              return {
                ...item,
                ...payload,
              };
            }
            return item;
          });

        case "delete":
          return state.filter((item) => item.id !== payload.id);

        default:
          return state;
      }
    }
  );

  return optimisticData?.map((record) => (
    <UpdateRecordForm
      key={record.id}
      duration={record.duration}
      assignedId={record.assigned_id}
      onCreate={() => updateEntries({ action: "create" })}
      onDelete={() => updateEntries({ action: "delete", id: record.id })}
      onChange={(params) => updateEntries({ action: "update", ...params })}
    />
  ));
}
