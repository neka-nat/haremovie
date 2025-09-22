resource "google_project_service" "required_apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "aiplatform.googleapis.com",
    "storage.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudtasks.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
  ])

  service            = each.key
  disable_on_destroy = false
}

output "required_apis" {
  value = google_project_service.required_apis
}
