import { updateEntriesAction } from "@/actions/project/update-entries-action";
import { useOptimisticAction } from "next-safe-action/hooks";
import { UpdateRecordForm } from "./forms/update-record.form";

export function TrackerEntriesList({ data, projectId, fetchData }) {
  const { execute: updateEntries, optimisticData } = useOptimisticAction(
    updateEntriesAction,
    data,
    (state, { action, ...payload }) => {
      switch (action) {
        case "create":
          return [...data, { ...payload }];
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
    },
    {
      onSuccess: async () => {
        await fetchData();
      },
    }
  );

  return optimisticData?.map((record) => (
    <UpdateRecordForm
      key={record.id}
      duration={record.duration}
      assignedId={record.assigned_id}
      onCreate={() =>
        updateEntries({
          action: "create",
          project_id: projectId,
          duration: 0,
        })
      }
      onDelete={() => updateEntries({ action: "delete", id: record.id })}
      onChange={(params) =>
        updateEntries({ action: "update", id: record.id, ...params })
      }
    />
  ));
}
