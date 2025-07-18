import type { InvoiceFormValues } from "./form-context";

export const transformFormValuesToDraft = (values: InvoiceFormValues) => {
  return {
    ...values,
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
    ...(values.customerDetails && {
      customerDetails: JSON.stringify(values.customerDetails),
    }),
    ...(values.noteDetails && {
      noteDetails: JSON.stringify(values.noteDetails),
    }),
  };
};
