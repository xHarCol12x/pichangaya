import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../email/email.service';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
    constructor(private readonly emailService: EmailService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { type, to, data } = job.data;

        switch (type) {
            case 'welcome':
                return this.emailService.sendWelcomeEmail(data.name, to);
            case 'password-reset':
                return this.emailService.sendPasswordResetEmail(to, data.link);
            default:
                console.warn(`Unknown email job type: ${type}`);
        }
    }
}
