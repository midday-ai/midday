import { secondsToHoursAndMinutes } from "@/utils/format";
import { format } from "date-fns";
import { CreateRecordForm } from "./forms/create-record-form";
import { RecordSkeleton, UpdateRecordForm } from "./forms/update-record-form";

export function TrackerEntriesList({
  data,
  date,
  user,
  isLoading,
  onCreate,
  onDelete,
  projectId,
}) {
  const currentDate = date ? new Date(date) : new Date();
  const totalDuration = data?.reduce(
    (duration, item) => item.duration + duration,
    0
  );

  return (
    <div>
      <div className="flex justify-between border-b-[1px] mt-12 mb-4 pb-2">
        <span>{format(currentDate, "LLL d")}</span>
        <span>{secondsToHoursAndMinutes(totalDuration)}</span>
      </div>

      {isLoading && <RecordSkeleton />}

      {data?.map((record) => (
        <UpdateRecordForm
          id={record.id}
          key={record.id}
          assigned={record.assigned}
          description={record.description}
          duration={record.duration}
          onDelete={onDelete}
        />
      ))}

      <CreateRecordForm
        userId={user.id}
        onCreate={onCreate}
        projectId={projectId}
      />
    </div>
  );
}
