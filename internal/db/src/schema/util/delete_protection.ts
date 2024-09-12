import { boolean } from "drizzle-orm/mysql-core";

export const deleteProtection = {
  /**
   * deleteProtection ensures a resource can not be soft or hard deleted while this flag is true.
   * All delete operations must check this flag before proceeding and return an error if it is true.
   *
   * Toggling this flag should be a privileged operation and must be audited.
   */
  deleteProtection: boolean("delete_protection").default(false),
};
