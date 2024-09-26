import type { Command } from "@icliniqSmartDoctor/reactive-framework";

export type ReAssignMo = Command<"ReAssignMo"> & {
    moUserId: string;
};
