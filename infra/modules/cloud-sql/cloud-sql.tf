variable "gcp_project_id" {}
variable "primary_region" {}
variable "cloud_sql_instance_name" {}
variable "db_name" {}
variable "required_apis" {}
variable "google_secret_manager_secret_version" {}

resource "google_sql_database_instance" "postgres" {
  database_version = "POSTGRES_16"
  instance_type    = "CLOUD_SQL_INSTANCE"
  name             = var.cloud_sql_instance_name
  project          = var.gcp_project_id
  region           = var.primary_region

  settings {
    activation_policy = "ALWAYS"
    availability_type = "ZONAL"

    backup_configuration {
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }

      enabled                        = true
      location                       = "asia"
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7
    }

    connector_enforcement       = "NOT_REQUIRED"
    deletion_protection_enabled = true
    disk_autoresize             = true
    disk_autoresize_limit       = 0
    disk_size                   = 10
    disk_type                   = "PD_SSD"
    edition                     = "ENTERPRISE"

    database_flags {
      name  = "cloudsql.enable_google_ml_integration"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled = true
    }

    location_preference {
      zone = "${var.primary_region}-a"
    }

    maintenance_window {
      update_track = "canary"
      day          = 7
      hour         = 22
    }

    pricing_plan = "PER_USE"
    tier         = "db-custom-1-4096"
  }

  depends_on = [
    var.required_apis,
    var.google_secret_manager_secret_version,
  ]
}

resource "google_sql_user" "postgres" {
  project = var.gcp_project_id

  name     = "postgres"
  instance = google_sql_database_instance.postgres.name
  password = var.google_secret_manager_secret_version.DB_PASSWORD.secret_data
}

output "cloud_sql_instance_name" {
  value = google_sql_database_instance.postgres.name
}

output "instance_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "db_user" {
  value = google_sql_user.postgres.name
}
