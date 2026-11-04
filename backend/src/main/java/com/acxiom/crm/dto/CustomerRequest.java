package com.acxiom.crm.dto;

import com.acxiom.crm.entity.CustomerStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CustomerRequest {

    @NotBlank(message = "Customer Name is required.")
    @Size(max = 150, message = "Customer Name cannot exceed 150 characters.")
    private String customerName;

    @NotBlank(message = "Email is required.")
    @Email(message = "Enter a valid email address.")
    @Size(max = 150, message = "Email cannot exceed 150 characters.")
    private String email;

    @NotBlank(message = "Phone number is required.")
    @Pattern(regexp = "^[+0-9\\s\\-\\(\\)]{7,25}$", message = "Enter a valid phone number.")
    private String phone;

    @Size(max = 150, message = "Company Name cannot exceed 150 characters.")
    private String companyName;

    @Size(max = 255, message = "Address cannot exceed 255 characters.")
    private String address;

    @Size(max = 100, message = "City cannot exceed 100 characters.")
    private String city;

    @Size(max = 100, message = "State cannot exceed 100 characters.")
    private String state;

    private CustomerStatus status = CustomerStatus.ACTIVE;

    private Long assignedToUserId;

    public CustomerRequest() {}

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public CustomerStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerStatus status) {
        this.status = status;
    }

    public Long getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }
}

