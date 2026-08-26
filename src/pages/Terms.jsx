import { Link, useNavigate } from "react-router-dom";
import "../index.css";
import logo from "../assets/shipora-logo.jpeg";

function Terms() {
  const navigate = useNavigate();
  return (
    <main className="legal-page">

      <header className="legal-header">

        <Link to="/" className="legal-brand">

          <img
            src={logo}
            alt="SHIPORA"
          />

          <div>
            <strong>SHIPORA</strong>
            <span>LOGISTICS &amp; FORWARDING</span>
          </div>

        </Link>

        <button
  type="button"
  className="account-back-button"
  onClick={() => navigate(-1)}
>
  ← 
</button>
      </header>


      <article className="legal-document">

        <div className="legal-eyebrow">
          SHIPORA LEGAL
        </div>

        <h1>Terms of Service</h1>

        <p className="legal-updated">
          Effective Date: August 2026
        </p>


        <div className="legal-intro">

          <p>
            These Terms of Service ("Terms") govern your
            access to and use of the SHIPORA platform,
            website, applications and related logistics
            services ("Services").
          </p>

          <p>
            By creating an account, accessing the platform,
            requesting a delivery, accepting a delivery
            request or otherwise using SHIPORA, you agree
            to be bound by these Terms.
          </p>

          <p>
            If you do not agree with these Terms, you must
            not create an account or use the Services.
          </p>

        </div>


        <section>

          <h2>1. About SHIPORA</h2>

          <p>
            SHIPORA is a technology-enabled logistics
            platform that facilitates connections between
            customers, vendors, businesses and independent
            delivery providers.
          </p>

          <p>
            Depending on the service being used, SHIPORA
            may provide tools for shipment creation,
            delivery requests, dispatch matching, payment
            processing, shipment tracking, notifications,
            account management and related logistics
            services.
          </p>

          <p>
            SHIPORA may operate as a technology platform
            connecting users with delivery providers and
            does not necessarily act as the carrier for
            every shipment arranged through the platform.
          </p>

        </section>


        <section>

          <h2>2. Eligibility</h2>

          <p>
            You must be legally capable of entering into
            an agreement to use the Services.
          </p>

          <p>
            If you are using SHIPORA on behalf of a
            business or organization, you represent that
            you have authority to act on behalf of that
            business or organization.
          </p>

        </section>


        <section>

          <h2>3. Your SHIPORA Account</h2>

          <p>
            You may be required to provide accurate and
            current information when creating an account,
            including your name, email address, telephone
            number and other information requested by
            SHIPORA.
          </p>

          <p>
            You are responsible for maintaining the
            confidentiality of your account credentials and
            for activities performed through your account.
          </p>

          <p>
            You must not create an account using another
            person's identity or provide false information.
          </p>

          <p>
            You should notify SHIPORA promptly if you
            believe your account has been accessed without
            authorization.
          </p>

        </section>


        <section>

          <h2>4. Account Verification</h2>

          <p>
            SHIPORA may require users to verify information
            such as their identity, telephone number,
            business information, vehicle information or
            other relevant details.
          </p>

          <p>
            Delivery providers may be required to provide
            information relating to their identity, driving
            credentials, vehicle and other information
            relevant to their eligibility to provide
            delivery services.
          </p>

          <p>
            Verification does not constitute a guarantee
            that a user or delivery provider will perform
            their obligations correctly or safely.
          </p>

          <p>
            SHIPORA may refuse, suspend or withdraw
            verification where information is inaccurate,
            incomplete, fraudulent or otherwise fails to
            satisfy applicable requirements.
          </p>

        </section>


        <section>

          <h2>5. Vendors and Businesses</h2>

          <p>
            Vendors and businesses using SHIPORA are
            responsible for providing accurate shipment,
            pickup and destination information.
          </p>

          <p>
            Vendors must ensure that packages submitted for
            delivery are appropriately packaged and suitable
            for transportation.
          </p>

          <p>
            Vendors must not use SHIPORA to arrange the
            transportation of prohibited, unlawful or
            dangerous goods.
          </p>

        </section>


        <section>

          <h2>6. Delivery Providers</h2>

          <p>
            Delivery providers using SHIPORA are
            responsible for maintaining the information
            associated with their account accurately and
            complying with applicable laws and platform
            requirements.
          </p>

          <p>
            Delivery providers must accept only deliveries
            they are capable of completing safely and
            lawfully.
          </p>

          <p>
            Delivery providers are responsible for taking
            reasonable care of packages while those
            packages are in their possession or control.
          </p>

          <p>
            A delivery provider must update shipment status
            accurately and confirm delivery through the
            procedures provided by SHIPORA.
          </p>

        </section>


        <section>

          <h2>7. Shipment Information</h2>

          <p>
            Users are responsible for ensuring that all
            shipment information submitted to SHIPORA is
            accurate, complete and up to date.
          </p>

          <p>
            This may include package description,
            quantity, pickup address, destination address,
            recipient information and other delivery
            instructions.
          </p>

          <p>
            Incorrect or incomplete information may result
            in delays, additional charges, cancellation or
            inability to complete a delivery.
          </p>

        </section>


        <section>

          <h2>8. Prohibited Items and Activities</h2>

          <p>
            SHIPORA must not be used to transport or
            facilitate the transportation of goods that are
            illegal or prohibited under applicable law.
          </p>

          <p>
            Prohibited items may include, where applicable,
            illegal drugs, unauthorized weapons, explosives,
            stolen goods, counterfeit goods, hazardous
            materials and other restricted items.
          </p>

          <p>
            SHIPORA may refuse, cancel or investigate a
            shipment where there are reasonable grounds to
            believe that prohibited goods or unlawful
            activity may be involved.
          </p>

        </section>


        <section>

          <h2>9. Delivery Fees and Platform Charges</h2>

          <p>
            Delivery fees may be calculated using factors
            such as pickup location, destination, distance,
            delivery type, package characteristics,
            availability and other operational factors.
          </p>

          <p>
            The applicable fee will be displayed to the
            relevant user before confirmation where
            applicable.
          </p>

          <p>
            SHIPORA may charge platform, service or other
            applicable fees. Any applicable charges will be
            communicated through the platform.
          </p>

        </section>


        <section>

          <h2>10. Payments</h2>

          <p>
            Payments made through SHIPORA may be processed
            using third-party payment providers.
          </p>

          <p>
            Users authorize SHIPORA and its applicable
            payment partners to process transactions
            initiated through the platform.
          </p>

          <p>
            Where the SHIPORA payment process involves
            funds being held pending completion of a
            delivery, release of those funds may depend on
            the applicable delivery and confirmation
            conditions.
          </p>

          <p>
            Payment processing may be subject to the terms,
            conditions and availability of the relevant
            payment provider.
          </p>

        </section>


        <section>

          <h2>11. Delivery Confirmation and Payment Release</h2>

          <p>
            Where applicable, SHIPORA may require a
            delivery provider to mark a shipment as
            delivered and may require additional delivery
            confirmation.
          </p>

          <p>
            SHIPORA may use delivery status, confirmation
            information and other available information to
            determine whether funds associated with a
            shipment may be released.
          </p>

          <p>
            SHIPORA may delay, review or restrict payment
            release where there is a dispute, suspected
            fraud, incomplete delivery confirmation or
            another legitimate operational or security
            concern.
          </p>

        </section>


        <section>

          <h2>12. Cancellations and Refunds</h2>

          <p>
            Cancellation and refund eligibility may depend
            on the stage of a shipment, the circumstances
            surrounding the cancellation and the applicable
            payment or service terms.
          </p>

          <p>
            Where a refund is approved, the applicable
            amount may be returned through the original
            payment method or another supported method.
          </p>

          <p>
            Certain third-party payment processing fees or
            other legitimate charges may be non-refundable
            where permitted by applicable law.
          </p>

        </section>


        <section>

          <h2>13. Damaged, Lost or Incorrect Shipments</h2>

          <p>
            Users should report shipment issues to SHIPORA
            as soon as reasonably possible.
          </p>

          <p>
            SHIPORA may investigate reported incidents and
            may request photographs, delivery information,
            transaction records or other relevant evidence.
          </p>

          <p>
            Responsibility for loss or damage may depend on
            the circumstances of the shipment, applicable
            law and any additional terms applicable to the
            specific delivery service.
          </p>

        </section>


        <section>

          <h2>14. Ratings and Reviews</h2>

          <p>
            SHIPORA may allow users to provide ratings,
            reviews or feedback regarding delivery
            experiences.
          </p>

          <p>
            Reviews must be honest, relevant and must not
            contain threats, harassment, discriminatory
            content, personal information or intentionally
            misleading claims.
          </p>

        </section>


        <section>

          <h2>15. Platform Safety and Fraud Prevention</h2>

          <p>
            SHIPORA may use automated and manual systems to
            detect suspicious activity, fraud, unauthorized
            access and other security risks.
          </p>

          <p>
            Users must not attempt to manipulate shipment
            status, payments, ratings, verification systems
            or other platform features.
          </p>

        </section>


        <section>

          <h2>16. Account Suspension and Termination</h2>

          <p>
            SHIPORA may suspend, restrict or terminate an
            account where it reasonably believes that the
            user has violated these Terms, provided false
            information, engaged in fraud, misused the
            platform, created a security risk or participated
            in unlawful activity.
          </p>

          <p>
            Where appropriate, SHIPORA may provide notice
            regarding account restrictions, subject to
            security, legal and operational considerations.
          </p>

        </section>


        <section>

          <h2>17. Intellectual Property</h2>

          <p>
            SHIPORA and its associated software, branding,
            logos, designs, text, graphics and other
            materials are protected by applicable
            intellectual property laws.
          </p>

          <p>
            You may not reproduce, modify, distribute,
            reverse engineer or commercially exploit
            SHIPORA materials without appropriate
            authorization.
          </p>

        </section>


        <section>

          <h2>18. Third-Party Services</h2>

          <p>
            SHIPORA may rely on third-party services for
            functions including payment processing,
            authentication, communications, mapping,
            hosting, verification and other infrastructure.
          </p>

          <p>
            Third-party services may have their own terms
            and privacy policies, which may also apply to
            your use of those services.
          </p>

        </section>


        <section>

          <h2>19. Disclaimer</h2>

          <p>
            SHIPORA provides the platform and Services on
            an ongoing basis but does not guarantee that the
            platform will always be uninterrupted, error
            free or available at all times.
          </p>

          <p>
            Delivery estimates are estimates and may be
            affected by traffic, weather, operational
            conditions, incorrect information, third-party
            providers or circumstances beyond SHIPORA's
            reasonable control.
          </p>

        </section>


        <section>

          <h2>20. Limitation of Liability</h2>

          <p>
            To the maximum extent permitted by applicable
            law, SHIPORA will not be responsible for
            indirect, incidental, special or consequential
            losses arising from your use of the platform.
          </p>

          <p>
            Nothing in these Terms is intended to exclude
            or limit liability that cannot legally be
            excluded or limited under applicable law.
          </p>

        </section>


        <section>

          <h2>21. Indemnification</h2>

          <p>
            To the extent permitted by law, you agree to
            indemnify and hold SHIPORA and its applicable
            personnel and service providers harmless from
            claims, losses, liabilities and expenses arising
            from your unlawful use of the Services, violation
            of these Terms or violation of another person's
            rights.
          </p>

        </section>


        <section>

          <h2>22. Privacy</h2>

          <p>
            SHIPORA collects and processes personal
            information in accordance with its Privacy
            Policy.
          </p>

          <p>
            By using SHIPORA, you acknowledge that your
            information may be processed as described in the
            Privacy Policy.
          </p>

          <p>
            <Link to="/privacy">
              Read the SHIPORA Privacy Policy →
            </Link>
          </p>

        </section>


        <section>

          <h2>23. Changes to These Terms</h2>

          <p>
            SHIPORA may update these Terms from time to
            time as the platform, Services, legal
            requirements or business operations develop.
          </p>

          <p>
            Where appropriate, material changes may be
            communicated through the platform or other
            reasonable channels.
          </p>

          <p>
            Continued use of SHIPORA after an updated Terms
            of Service becomes effective constitutes
            acceptance of the updated Terms, to the extent
            permitted by applicable law.
          </p>

        </section>


        <section>

          <h2>24. Governing Law</h2>

          <p>
            These Terms shall be interpreted in accordance
            with the applicable laws of the Federal Republic
            of Nigeria, subject to any mandatory rights or
            protections applicable to users under law.
          </p>

        </section>


        <section>

          <h2>25. Contacting SHIPORA</h2>

          <p>
            If you have questions, complaints or concerns
            regarding these Terms or the SHIPORA Services,
            please use the official support or contact
            channel provided by SHIPORA.
          </p>

        </section>


        <div className="legal-bottom">

          <button
  type="button"
  className="legal-primary-button"
  onClick={() => navigate(-1)}
>Back</button>

        </div>

      </article>


      <footer className="legal-footer">

        <strong>SHIPORA</strong>

        <span>
          Logistics &amp; Forwarding
        </span>

      </footer>

    </main>
  );
}

export default Terms;