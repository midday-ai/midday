import { updateEntriesAction } from "@/actions/project/update-entries-action";
import { useOptimisticAction } from "next-safe-action/hooks";
import { CreateRecordForm } from "./forms/create-record-form";
import { RecordSkeleton, UpdateRecordForm } from "./forms/update-record-form";

export function TrackerEntriesList({
  data,
  projectId,
  date,
  defaultAssignedId,
  isLoading,
}) {
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
    }
  );

  // const handleOnCreate = () => {
  //   updateEntries({
  //     action: "create",
  //     id: uuidv4(),
  //     project_id: projectId,
  //     assigned_id: defaultAssignedId,
  //     date,
  //     duration: 0,
  //   });
  // };

  const handleOnDelete = (id: string) => {
    updateEntries({ action: "delete", id });
  };

  const handleOnChange = (params) => {
    updateEntries({
      action: "update",
      project_id: projectId,
      assigned_id: defaultAssignedId,
      duration: 0,
      date,
      ...params,
    });
  };

  const showEmptyState = isLoading || (!isLoading && !optimisticData);
  const records = optimisticData && optimisticData[date];

  return (
    <div>
      <div className="flex justify-between border-b-[1px] mt-8 mb-4 pb-2">
        <span>Jan 14</span>
        <span>20h</span>
      </div>

      {showEmptyState && (
        <div className="h-[40px]">
          {isLoading && <RecordSkeleton />}
          {!isLoading && !optimisticData && (
            <span className="text-muted-foreground">No records</span>
          )}
        </div>
      )}

      {records?.map((record, index) => (
        <UpdateRecordForm
          id={record.id}
          key={record.id}
          assigned={record.assigned}
          description={record.description}
          duration={record.duration}
          onDelete={handleOnDelete}
          onChange={handleOnChange}
          canRemove={index > 0}
        />
      ))}

      <CreateRecordForm />
    </div>
  );
}
