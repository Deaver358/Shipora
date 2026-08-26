import { Link, useNavigate } from "react-router-dom";
import "../index.css";
import logo from "../assets/shipora-logo.jpeg";

function Privacy() {
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

        <h1>Privacy Policy</h1>

        <p className="legal-updated">
          Effective Date: August 2026
        </p>


        <div className="legal-intro">

          <p>
            This Privacy Policy explains how SHIPORA
            collects, uses, stores and protects information
            when you access or use the SHIPORA platform,
            website, applications and related logistics
            services.
          </p>

          <p>
            We are committed to handling personal
            information responsibly and transparently.
          </p>

        </div>


        <section>

          <h2>1. Information We Collect</h2>

          <p>
            Depending on how you use SHIPORA, we may
            collect different categories of information.
          </p>

          <h3>Account Information</h3>

          <p>
            When you create an account, we may collect
            information such as your full name, email
            address, telephone number and authentication
            information.
          </p>

          <h3>Vendor Information</h3>

          <p>
            Vendors and businesses may provide additional
            information such as business details, pickup
            information, delivery information and other
            information necessary to provide logistics
            services.
          </p>

          <h3>Delivery Provider Information</h3>

          <p>
            Delivery providers may be required to provide
            identity, contact, vehicle and other
            verification information required to operate
            on the platform.
          </p>

          <p>
            Depending on the verification process used by
            SHIPORA, this information may include relevant
            identification or vehicle documentation.
          </p>

          <h3>Shipment Information</h3>

          <p>
            We may collect information relating to
            shipments, including package descriptions,
            pickup addresses, destination addresses,
            delivery instructions, tracking information,
            courier information and shipment images.
          </p>

          <h3>Payment Information</h3>

          <p>
            Payments may be processed through third-party
            payment providers. SHIPORA may receive
            transaction information such as payment status,
            transaction references, amounts and currency.
          </p>

          <p>
            We do not necessarily receive or store complete
            card details processed by third-party payment
            providers.
          </p>

          <h3>Communications</h3>

          <p>
            We may collect information contained in
            communications between you and SHIPORA,
            including support requests and service-related
            messages.
          </p>

          <h3>Technical Information</h3>

          <p>
            We may automatically receive technical
            information such as IP address, browser type,
            device information, operating system and
            interaction information when you use the
            platform.
          </p>

        </section>


        <section>

          <h2>2. How We Use Information</h2>

          <p>
            SHIPORA may use collected information to:
          </p>

          <ul>
            <li>Create and manage user accounts.</li>
            <li>Authenticate users and protect accounts.</li>
            <li>Facilitate shipments and deliveries.</li>
            <li>Connect vendors with delivery providers.</li>
            <li>Process and confirm payments.</li>
            <li>Provide shipment tracking.</li>
            <li>Send service-related notifications.</li>
            <li>Perform verification and fraud prevention.</li>
            <li>Provide customer support.</li>
            <li>Improve platform performance and services.</li>
            <li>Maintain security and prevent abuse.</li>
            <li>Comply with applicable legal obligations.</li>
          </ul>

        </section>


        <section>

          <h2>3. Email Communications</h2>

          <p>
            SHIPORA may send emails relating to account
            creation, email verification, password recovery,
            shipment creation, payment status, delivery
            updates, security alerts and other essential
            service communications.
          </p>

          <p>
            These communications are necessary for
            providing certain SHIPORA services and may
            continue even if you opt out of non-essential
            promotional communications.
          </p>

        </section>


        <section>

          <h2>4. Phone and SMS Communications</h2>

          <p>
            SHIPORA may use your telephone number for
            account verification, security, delivery
            coordination, service notifications and other
            legitimate platform purposes.
          </p>

          <p>
            Where SMS services are used, messages may be
            delivered through third-party communication
            providers.
          </p>

          <p>
            Any required consent or opt-out mechanism for
            promotional SMS communications will be provided
            where applicable.
          </p>

        </section>


        <section>

          <h2>5. Identity and Verification Information</h2>

          <p>
            To improve trust and platform safety, SHIPORA
            may require certain users to complete identity,
            business or vehicle verification.
          </p>

          <p>
            Verification information may be used to confirm
            eligibility, prevent fraud, protect users and
            comply with applicable requirements.
          </p>

          <p>
            Where a specialized third-party verification
            provider is used, verification information may
            be processed by that provider according to its
            applicable privacy practices.
          </p>

        </section>


        <section>

          <h2>6. Location and Delivery Information</h2>

          <p>
            SHIPORA may process pickup and destination
            addresses and other location information needed
            to coordinate deliveries.
          </p>

          <p>
            Where location-based functionality is introduced,
            we will request the permissions or provide the
            controls required for that functionality.
          </p>

          <p>
            Location information may be shared with relevant
            parties where necessary to complete an
            authorized delivery.
          </p>

        </section>


        <section>

          <h2>7. Sharing Information</h2>

          <p>
            SHIPORA may share relevant information with
            parties when necessary to provide the Services.
          </p>

          <p>
            These parties may include:
          </p>

          <ul>
            <li>
              Delivery providers assigned to a shipment.
            </li>

            <li>
              Vendors or recipients involved in a delivery.
            </li>

            <li>
              Payment processing providers.
            </li>

            <li>
              Authentication and infrastructure providers.
            </li>

            <li>
              Identity or verification providers.
            </li>

            <li>
              Communication and notification providers.
            </li>

            <li>
              Hosting, analytics and technical service
              providers.
            </li>

            <li>
              Government authorities or other parties where
              legally required.
            </li>
          </ul>

          <p>
            SHIPORA does not sell personal information merely
            for the purpose of allowing third parties to
            independently market their products to you.
          </p>

        </section>


        <section>

          <h2>8. Payment Providers</h2>

          <p>
            Payment transactions may be processed through
            third-party payment providers such as Paystack
            or other supported providers.
          </p>

          <p>
            Payment providers may independently process
            certain payment information under their own
            privacy policies and applicable security
            requirements.
          </p>

        </section>


        <section>

          <h2>9. Google Sign-In</h2>

          <p>
            SHIPORA may allow you to create or access an
            account using Google authentication.
          </p>

          <p>
            When you choose Google Sign-In, Google may
            provide SHIPORA with account information required
            to establish your SHIPORA account, subject to
            the permissions and authentication process.
          </p>

          <p>
            Your use of Google services is also subject to
            Google's applicable terms and privacy practices.
          </p>

        </section>


        <section>

          <h2>10. Cookies and Similar Technologies</h2>

          <p>
            SHIPORA may use cookies, local storage,
            session technologies and similar mechanisms to
            maintain authentication sessions, remember
            preferences, improve security and understand
            how the platform is used.
          </p>

          <p>
            Some third-party services integrated into SHIPORA
            may also use similar technologies.
          </p>

        </section>


        <section>

          <h2>11. Data Security</h2>

          <p>
            SHIPORA uses reasonable technical and
            organizational measures designed to protect
            personal information from unauthorized access,
            misuse, alteration or disclosure.
          </p>

          <p>
            However, no internet-based service can guarantee
            absolute security.
          </p>

        </section>


        <section>

          <h2>12. Data Retention</h2>

          <p>
            SHIPORA may retain information for as long as
            reasonably necessary to provide the Services,
            maintain business and transaction records,
            resolve disputes, prevent fraud, comply with
            legal obligations and enforce agreements.
          </p>

          <p>
            Retention periods may vary depending on the type
            of information and the reason it was collected.
          </p>

        </section>


        <section>

          <h2>13. Your Privacy Rights</h2>

          <p>
            Depending on applicable law, you may have rights
            relating to your personal information, including
            rights to request access, correction, deletion,
            restriction or other forms of control over your
            information.
          </p>

          <p>
            Requests may be subject to identity verification
            and applicable legal limitations.
          </p>

        </section>


        <section>

          <h2>14. Account Deletion</h2>

          <p>
            You may request deletion of your SHIPORA account
            through the available account or support
            channels.
          </p>

          <p>
            Certain information may need to be retained where
            required for legal, security, fraud prevention,
            accounting or legitimate operational purposes.
          </p>

        </section>


        <section>

          <h2>15. Children's Privacy</h2>

          <p>
            SHIPORA is not intended for individuals who are
            not legally permitted to enter into agreements
            for the Services.
          </p>

          <p>
            We do not knowingly collect personal information
            from children for independent use of the
            platform.
          </p>

        </section>


        <section>

          <h2>16. International and Third-Party Processing</h2>

          <p>
            Some service providers used by SHIPORA may
            process information outside Nigeria or in
            jurisdictions different from where you are
            located.
          </p>

          <p>
            Where applicable, SHIPORA will seek to use
            appropriate safeguards for such processing.
          </p>

        </section>


        <section>

          <h2>17. Changes to This Privacy Policy</h2>

          <p>
            SHIPORA may update this Privacy Policy as the
            platform, technology, legal requirements or
            services develop.
          </p>

          <p>
            Material changes may be communicated through
            the platform or other appropriate channels.
          </p>

          <p>
            The effective date shown at the beginning of
            this Privacy Policy indicates when the current
            version became effective.
          </p>

        </section>


        <section>

          <h2>18. Contact and Privacy Requests</h2>

          <p>
            If you have questions about this Privacy Policy
            or wish to make a privacy-related request,
            please use the official SHIPORA support or
            contact channel provided on the platform.
          </p>

        </section>


        <section>

          <h2>19. Applicable Privacy Requirements</h2>

          <p>
            SHIPORA intends to operate its privacy practices
            in accordance with applicable Nigerian data
            protection requirements and other laws that may
            apply to its Services.
          </p>

          <p>
            As SHIPORA expands, its privacy practices and
            compliance procedures may be updated to reflect
            applicable regulatory requirements.
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

export default Privacy;