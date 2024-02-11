import { updateEntriesAction } from "@/actions/project/update-entries-action";
import { useOptimisticAction } from "next-safe-action/hooks";
import { v4 as uuidv4 } from "uuid";
import { UpdateRecordForm } from "./forms/update-record.form";

export function TrackerEntriesList({ data, projectId, fetchData, date }) {
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

  const handleOnCreate = () => {
    updateEntries({
      action: "create",
      id: uuidv4(),
      project_id: projectId,
      duration: 0,
    });
  };

  const handleOnDelete = (id: string) => {
    updateEntries({ action: "delete", id });
  };

  const handleOnChange = (params) => {
    updateEntries({
      action: "update",
      project_id: projectId,
      duration: 0,
      date,
      ...params,
    });
  };

  return optimisticData?.map((record) => (
    <UpdateRecordForm
      id={record.id}
      key={record.id}
      duration={record.duration}
      assignedId={record.assigned_id}
      onCreate={handleOnCreate}
      onDelete={handleOnDelete}
      onChange={handleOnChange}
    />
  ));
}
