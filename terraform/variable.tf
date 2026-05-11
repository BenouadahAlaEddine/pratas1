variable "region" {
  default = "eu-west-3"
}

variable "vpc_name" {
  type = string
}

variable "key_name" {
  type = string

}
variable "ami_id" {
  type = string
}

variable "IGW" {
    type    = string
    
  
}
variable "natgtw" {
    type = string
  
}
variable "az" {
    type    = string
  
}
variable "instance_type_jenkins" {
  type = string
}
variable "instance_type_sonar" {
  type = string
}
variable "instance_type_k8s" {
  type = string
}
variable "instance_type_k8s_worker" {
  type = string
}