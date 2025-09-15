variable "gcp_project_id" {}
variable "primary_region" {}
variable "queue_name"     {}
variable "required_apis"  {}

resource "google_cloud_tasks_queue" "this" {
  name     = var.queue_name
  project  = var.gcp_project_id
  location = var.primary_region

  retry_config {
    max_attempts       = 1
    max_retry_duration = "0s"
  }

  depends_on = [var.required_apis]
}

output "queue_name" { value = google_cloud_tasks_queue.this.name }
