import type { InvoiceFormValues } from "./form-context";

export const transformFormValuesToDraft = (values: InvoiceFormValues) => {
  return {
    ...values,
    // Extract templateId from template.id for persistence
    templateId: values.template?.id ?? null,
    template: {
      ...values.template,
      ...(values.paymentDetails && {
        paymentDetails: JSON.stringify(values.paymentDetails),
      }),
      ...(values.fromDetails && {
        fromDetails: JSON.stringify(values.fromDetails),
      }),
    },
    ...(values.paymentDetails && {
      paymentDetails: JSON.stringify(values.paymentDetails),
    }),
    ...(values.fromDetails && {
      fromDetails: JSON.stringify(values.fromDetails),
    }),
    ...(values.merchantDetails && {
      merchantDetails: JSON.stringify(values.merchantDetails),
    }),
    ...(values.noteDetails && {
      noteDetails: JSON.stringify(values.noteDetails),
    }),
  };
};
