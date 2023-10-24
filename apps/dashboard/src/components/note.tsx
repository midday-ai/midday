import { Textarea } from "@midday/ui/textarea";

export function Note({ defaultValue }) {
  return (
    <Textarea
      name="feedback"
      defaultValue={defaultValue}
      required
      autoFocus
      placeholder="Note"
      className="min-h-[100px] resize-none"
      // onChange={(evt) => setValue(evt.target.value)}
    />
  );

  //   <div className="mt-1 flex items-center justify-end">
  {
    /* <SubmitButton /> */
  }
  //   </div>
}
