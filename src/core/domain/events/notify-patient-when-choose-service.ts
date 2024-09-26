//todo: code-gen generated file, please verify and make changes and remove this comment once verified
import type { DomainEvent } from "@icliniqSmartDoctor/reactive-framework";
import type { PreConsultation , PreConsultationNotification} from "../model/types/pre-consultation-aggregate.js";

export type NotifyPatientWhenChooseService = DomainEvent<PreConsultation, "NotifyPatientWhenChooseService"> & {
    PreConsultationNotification: PreConsultationNotification
}