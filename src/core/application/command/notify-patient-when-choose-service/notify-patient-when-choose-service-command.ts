import type { Command } from "@icliniqSmartDoctor/reactive-framework";

export type NotifyPatientWhenChooseServiceCommand = Command<"NotifyPatientWhenChooseServiceCommand"> & {
    IRN: string;
};

