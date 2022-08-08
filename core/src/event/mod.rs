pub mod event_manager;

use rocket::tokio::sync::oneshot;
use serde::{Deserialize, Serialize};

use crate::{
	job::{Job, JobReport, JobStatus, JobUpdate},
	prisma,
};

pub enum ClientRequest {
	QueueJob(Box<dyn Job>),
	GetJobReports(oneshot::Sender<Vec<JobReport>>),
}

pub enum ClientResponse {
	GetJobReports(Vec<JobReport>),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum ClientEvent {
	JobStarted(JobUpdate),
	JobProgress(JobUpdate),
	JobComplete(String),
	// FIXME: don't use tuple
	JobFailed((String, String)),
	CreatedMedia(prisma::media::Data),
	CreatedSeries(prisma::series::Data),
}

impl ClientEvent {
	pub fn job_started(
		runner_id: String,
		current_task: u64,
		task_count: u64,
		message: Option<String>,
	) -> Self {
		ClientEvent::JobStarted(JobUpdate {
			runner_id,
			current_task,
			task_count,
			message,
			status: Some(JobStatus::Running),
		})
	}

	pub fn job_progress(
		runner_id: String,
		current_task: u64,
		task_count: u64,
		message: Option<String>,
	) -> Self {
		ClientEvent::JobProgress(JobUpdate {
			runner_id,
			current_task,
			task_count,
			message,
			status: Some(JobStatus::Running),
		})
	}
}
