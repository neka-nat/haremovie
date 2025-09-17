variable "gcp_project_id" {}
variable "gcp_project_number" {}
variable "primary_region" {}
variable "bucket_name" {}
variable "required_apis" {}

resource "google_storage_bucket" "artifacts" {
  name          = var.bucket_name
  project       = var.gcp_project_id
  location      = var.primary_region
  uniform_bucket_level_access = true
  force_destroy = true
  depends_on    = [var.required_apis]
}

resource "google_storage_bucket" "adk-bucket" {
  name          = "${var.gcp_project_id}-adk-bucket"
  project       = var.gcp_project_id
  location      = "us-central1"
  uniform_bucket_level_access = true
  force_destroy = true
  depends_on    = [var.required_apis]
}

resource "google_storage_bucket_iam_member" "lvm_video_server" {
  bucket = google_storage_bucket.artifacts.name
  role   = "roles/storage.objectCreator"
  member = "user:cloud-lvm-video-server@prod.google.com"
}

resource "google_storage_bucket_iam_member" "vertex_ai_reasoning_engine" {
  bucket = google_storage_bucket.artifacts.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:service-${var.gcp_project_number}@gcp-sa-aiplatform-re.iam.gserviceaccount.com"
}

output "bucket_name" {
  value = google_storage_bucket.artifacts.name
}
