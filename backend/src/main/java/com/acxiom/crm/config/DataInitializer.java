package com.acxiom.crm.config;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.entity.*;
import com.acxiom.crm.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "acxiom.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final FollowUpRepository followUpRepository;
    private final ActivityRepository activityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${acxiom.seed.admin-email:admin@acxiomcrm.com}")
    private String adminEmail;

    @Value("${acxiom.seed.admin-password:Admin@Acxiom2026!}")
    private String adminPassword;

    @Value("${acxiom.seed.manager-email:manager@acxiomcrm.com}")
    private String managerEmail;

    @Value("${acxiom.seed.manager-password:Manager@Acxiom2026!}")
    private String managerPassword;

    @Value("${acxiom.seed.sales1-email:sales1@acxiomcrm.com}")
    private String sales1Email;

    @Value("${acxiom.seed.sales1-password:Sales@Acxiom2026!}")
    private String sales1Password;

    @Value("${acxiom.seed.sales2-email:sales2@acxiomcrm.com}")
    private String sales2Email;

    @Value("${acxiom.seed.sales2-password:Sales@Acxiom2026!}")
    private String sales2Password;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           CustomerRepository customerRepository,
                           LeadRepository leadRepository,
                           OpportunityRepository opportunityRepository,
                           FollowUpRepository followUpRepository,
                           ActivityRepository activityRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.followUpRepository = followUpRepository;
        this.activityRepository = activityRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    public void run(String... args) {
        logger.info("Checking and seeding default reference roles and seed users...");

        // 1. Roles
        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseGet(() ->
                roleRepository.save(new Role(RoleName.ADMIN, "Administrator with full system privileges")));

        Role managerRole = roleRepository.findByName(RoleName.MANAGER).orElseGet(() ->
                roleRepository.save(new Role(RoleName.MANAGER, "Sales Manager with team-level oversight")));

        Role salesRole = roleRepository.findByName(RoleName.SALES_EXECUTIVE).orElseGet(() ->
                roleRepository.save(new Role(RoleName.SALES_EXECUTIVE, "Sales Executive managing assigned pipeline")));

        // 2. Default Users
        User admin = seedUser("Alexander Wright", adminEmail, adminPassword, adminRole, "Executive Management");
        User manager = seedUser("Marcus Vance", managerEmail, managerPassword, managerRole, "Enterprise Sales");
        User sales1 = seedUser("Sarah Jenkins", sales1Email, sales1Password, salesRole, "Enterprise Sales");
        User sales2 = seedUser("David Chen", sales2Email, sales2Password, salesRole, "Enterprise Sales");

        // 3. Customers
        if (customerRepository.count() == 0) {
            logger.info("Seeding initial enterprise customers...");

            Customer c1 = customerRepository.save(new Customer(
                    "CUST-1001", "Apex Global Technologies", "contact@apextech.io", "+1-415-555-0199",
                    "Apex Global Inc.", "100 Innovation Way, Suite 400", "San Francisco", "CA",
                    CustomerStatus.ACTIVE, sales1, admin));

            Customer c2 = customerRepository.save(new Customer(
                    "CUST-1002", "Blue Horizon Financial", "procurement@bluehorizon.com", "+1-212-555-0142",
                    "Blue Horizon Corp.", "75 Wall Street, 22nd Floor", "New York", "NY",
                    CustomerStatus.ACTIVE, sales2, admin));

            Customer c3 = customerRepository.save(new Customer(
                    "CUST-1003", "Starlight Healthcare Systems", "vendor-relations@starlighthealth.org", "+1-312-555-0178",
                    "Starlight Health LLC", "500 Michigan Ave", "Chicago", "IL",
                    CustomerStatus.ACTIVE, sales1, manager));

            Customer c4 = customerRepository.save(new Customer(
                    "CUST-1004", "Vanguard Manufacturing Group", "info@vanguardmfg.com", "+1-313-555-0164",
                    "Vanguard Industries", "1200 Industrial Parkway", "Detroit", "MI",
                    CustomerStatus.ACTIVE, sales2, manager));

            // 4. Leads
            logger.info("Seeding initial enterprise leads...");

            Lead l1 = leadRepository.save(new Lead(
                    "LEAD-1001", "Jordan Ross", "jross@solarenergy.net", "+1-512-555-0188",
                    "SolarEnergy Dynamics", LeadSource.WEBSITE, LeadStatus.NEW,
                    BigDecimal.valueOf(45000.00), Priority.HIGH, sales1,
                    "Inbound interest for enterprise SaaS subscription.", admin));

            Lead l2 = leadRepository.save(new Lead(
                    "LEAD-1002", "Elena Rostova", "erostova@fintechpulse.com", "+1-650-555-0133",
                    "Fintech Pulse", LeadSource.REFERRAL, LeadStatus.CONTACTED,
                    BigDecimal.valueOf(80000.00), Priority.HIGH, sales2,
                    "Referred by Apex Global CTIO. Scheduled discovery meeting.", manager));

            Lead l3 = leadRepository.save(new Lead(
                    "LEAD-1003", "Thomas Sterling", "tsterling@sterlinglogistics.com", "+1-206-555-0122",
                    "Sterling Logistics", LeadSource.CAMPAIGN, LeadStatus.QUALIFIED,
                    BigDecimal.valueOf(120000.00), Priority.HIGH, sales1,
                    "Qualified for Phase 1 enterprise CRM rollout.", sales1));

            Lead l4 = leadRepository.save(new Lead(
                    "LEAD-1004", "Maria Gomez", "mgomez@biovista.org", "+1-617-555-0155",
                    "BioVista Research", LeadSource.COLD_CALL, LeadStatus.UNQUALIFIED,
                    BigDecimal.valueOf(15000.00), Priority.LOW, sales2,
                    "Budget not approved for current fiscal cycle.", sales2));

            // 5. Opportunities
            logger.info("Seeding initial sales pipeline opportunities...");

            Opportunity opp1 = opportunityRepository.save(new Opportunity(
                    "Apex CRM Integration & Scaled Licensing", c1, null,
                    BigDecimal.valueOf(150000.00), OpportunityStage.NEGOTIATION, 80,
                    LocalDate.now().plusDays(20), OpportunityStatus.OPEN, sales1,
                    "Direct Expansion", "Final terms and SLA under legal review.", admin));

            Opportunity opp2 = opportunityRepository.save(new Opportunity(
                    "Blue Horizon Multi-Branch Deployment", c2, null,
                    BigDecimal.valueOf(220000.00), OpportunityStage.PROPOSAL, 60,
                    LocalDate.now().plusDays(45), OpportunityStatus.OPEN, sales2,
                    "Referral", "Proposal submitted to Procurement Committee.", manager));

            Opportunity opp3 = opportunityRepository.save(new Opportunity(
                    "Starlight EHR & CRM Bridge System", c3, null,
                    BigDecimal.valueOf(310000.00), OpportunityStage.WON, 100,
                    LocalDate.now().minusDays(15), OpportunityStatus.WON, sales1,
                    "Partner", "Deal closed and MSA executed.", manager));

            Opportunity opp4 = opportunityRepository.save(new Opportunity(
                    "Vanguard Supply Chain Telemetry Suite", c4, null,
                    BigDecimal.valueOf(95000.00), OpportunityStage.QUALIFICATION, 30,
                    LocalDate.now().plusDays(60), OpportunityStatus.OPEN, sales2,
                    "Website", "Scoping technical architecture requirements.", sales2));

            Opportunity opp5 = opportunityRepository.save(new Opportunity(
                    "Sterling Logistics Telemetry Cloud Deal", c2, l3,
                    BigDecimal.valueOf(120000.00), OpportunityStage.LOST, 0,
                    LocalDate.now().minusDays(30), OpportunityStatus.LOST, sales1,
                    "Campaign", "Lost to internal proprietary build.", sales1));

            // 6. Follow-Ups
            logger.info("Seeding follow-ups...");

            followUpRepository.save(new FollowUp(
                    RelatedType.CUSTOMER, c1, null, opp1,
                    Instant.now().plus(2, ChronoUnit.DAYS),
                    "Apex Global - Contract Executive Review", FollowUpType.MEETING,
                    FollowUpStatus.PLANNED, sales1,
                    "Walk through mutual NDA and indemnity clauses.", sales1));

            followUpRepository.save(new FollowUp(
                    RelatedType.LEAD, null, l2, null,
                    Instant.now().plus(4, ChronoUnit.DAYS),
                    "Fintech Pulse Demo Call", FollowUpType.DEMO,
                    FollowUpStatus.PLANNED, sales2,
                    "Prepare customized dashboard showcase for Elena.", sales2));

            followUpRepository.save(new FollowUp(
                    RelatedType.CUSTOMER, c3, null, opp3,
                    Instant.now().minus(5, ChronoUnit.DAYS),
                    "Post-Sale Onboarding Kickoff", FollowUpType.CALL,
                    FollowUpStatus.COMPLETED, sales1,
                    "Kickoff completed. Customer success team engaged.", manager));

            followUpRepository.save(new FollowUp(
                    RelatedType.OPPORTUNITY, c2, null, opp2,
                    Instant.now().minus(2, ChronoUnit.DAYS),
                    "Follow up on Blue Horizon RFP question response", FollowUpType.EMAIL,
                    FollowUpStatus.PLANNED, sales2,
                    "Overdue item: client requested clarification on Redis caching tier.", sales2));

            // 7. Activities
            logger.info("Seeding activities...");

            activityRepository.save(new Activity(
                    ActivityType.CALL, "Discovery Call with Jordan Ross",
                    "Discussed CRM automation needs and user seat count (45 seats).",
                    Instant.now().minus(1, ChronoUnit.DAYS), null, l1, null,
                    ActivityStatus.COMPLETED, sales1, sales1));

            activityRepository.save(new Activity(
                    ActivityType.MEETING, "Executive Briefing: Blue Horizon Stakeholders",
                    "Demonstrated enterprise security, JWT token revocation, and role partitioning.",
                    Instant.now().minus(3, ChronoUnit.DAYS), c2, null, opp2,
                    ActivityStatus.COMPLETED, sales2, sales2));

            activityRepository.save(new Activity(
                    ActivityType.EMAIL, "Sent Starlight Healthcare Final Statement of Work",
                    "Delivered signed digital contract copy and implementation timetable.",
                    Instant.now().minus(16, ChronoUnit.DAYS), c3, null, opp3,
                    ActivityStatus.COMPLETED, sales1, admin));

            // 8. Audit logs
            auditService.logEvent(admin.getId(), admin.getEmail(), "SYSTEM_INIT", "PLATFORM",
                    "1", null, "INITIALIZED", "SUCCESS",
                    "AcxiomCRM baseline seed initialization successfully executed.", "127.0.0.1");

            logger.info("AcxiomCRM seed data populated successfully!");
        }
    }

    private User seedUser(String name, String email, String password, Role role, String department) {
        String cleanEmail = email.trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmailIgnoreCase(cleanEmail);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = new User(name, cleanEmail, passwordEncoder.encode(password), role, department);
        user.setActive(true);
        return userRepository.save(user);
    }
}
