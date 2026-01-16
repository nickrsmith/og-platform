# OG Application - Project Discussion

**Date:** [Conversation Date]  
**Participants:** Nick Smith (NS), Zain Jaffery

---

## Initial Review & Architecture Discussion

**Zain Jaffery:**  
Hey Nick, I reviewed the plan and overall the architecture looks solid. Most of the backend services already exist and just need to be wired up properly, and the frontend UI is in place it just needs to switch from mock data to real API connections.

A few things I want to flag:

- **Identity Verification:** CLEAR is primarily a TSA/airport biometric system and might not be the best fit here. I'd recommend looking at Persona or Jumio instead since they have much better developer APIs and are specifically built for KYC use cases like this.

- **E-Notary:** I couldn't find solid API documentation for "Simplify." If you need a proven solution, Notarize has a well-documented API for remote online notarization that might be easier to integrate.

- **Architecture Question:** I know the Lens Platform and P2P layer exist in the hauska application repo along with core-api. For this MVP, do you want me to pull that in and use the full P2P architecture, or would you prefer to keep it simple with direct database queries through core-api and add the P2P layer later? Just want to make sure I'm structuring the backend approach the right way.

Once you clarify that, I can put together the custom instructions for the project folder so the build path is clear.

---

## P2P Architecture Discussion

**NS (5:34 PM):**  
How comfortable are you with p2p?

**Zain Jaffery (5:37 PM):**  
I'm comfortable

**NS (5:39 PM):**  
As long as we use IPFS for the database I'm open to suggestions (smart contracts are based off CID). One of the cornerstones of my thesis is data sovereignty so p2p at some point but this platform is set to evolve quickly. What are your thoughts?

Simplify is a custom OG product and carries a certain function. I'll reach out to the company.  
Open to options for CLEAR

**Zain Jaffery (5:46 PM):**  
Makes sense. If IPFS is a hard requirement for the CID-based smart contracts, we keep it from the start. The ipfs-service already supports Pinata and Fula so that's ready to go.

For P2P, my suggestion is to use IPFS for data storage now to maintain CID integrity, but hold off on the full real-time sync layer (lens-platform) until the core MVP is functional. That locks in the data sovereignty foundation without adding complexity to the first release, and the architecture is already set up to plug P2P in cleanly when you're ready.

We could do CLEAR but for alternatives, I'd look at Persona or Jumio. Persona is popular in fintech/real estate with a clean API. Jumio is more enterprise-focused with stronger biometrics. Both work for gating listings and closings. Let me know if you have a preference and I can dig deeper.

**Zain Jaffery (6:04 PM):**  
How soon do you need this OG app launched by?

**NS (6:04 PM):**  
- Ignore the FuLa stuff. we tried it and it didn't work very well that's why we switched to Pinata.

- Sounds good on the lens setup. We'll still have tight RBAC though correct? Security and secrecy are HUGE in this industry due to the amount of money they deal with.

- Let's do Persona, appears to be more user friendly.

- This is the Simplifile we need, just to make sure we're looking at the same one:  
  https://mortgagetech.ice.com/products/simplifile/mortgage-transaction  
  It's the recording function that we need in addition to notary.

**Timeline:** 2 weeks or less

It was unfortunate about FuLa too, I really like the owner and the vision for what he is trying to do. Just wasn't reliable

---

## Legal & Access Details

**NS (6:18 PM):**  
Also, I have a couple other documents I'm going to want you to sign. NDA and invention assignment agreement. Anyone that helps you is going to need to sign the same set as well.

It covers things done under my umbrella

**Zain Jaffery (6:48 PM):**  
Got it, Pinata only. I'll make sure Fula references are removed from the setup.

Yes, RBAC will be tight. The architecture already has JWT-based auth with role checks, and for data rooms specifically we can enforce asset-based permissions so users only access what they own or are transacting on. Given how sensitive this industry is, I'll make sure access control is airtight across the board.

Persona it is. I'll start mapping out that integration.

And yes, that's the Simplifile I was looking at. Good to confirm we're on the same page. ICE Mortgage Technology has solid county coverage for e-recording, and if they handle notary as well that simplifies things since it's one vendor for both functions. Once you have API access details from them I can scope out the integration.

That's tough about Fula, Pinata should be good

---

## ICE Developer Portal Credentials

**NS (6:57 PM):**  
https://developer.ice.com/

**Login:** empressaioemail@gmail.com  
**Pass:** Jgcei&zU27DtNVn

I think there will be a 2FA the first time you login

**Zain Jaffery (7:20 PM):**  
Okay nice thanks

Is the repo made yet?

**NS (7:30 PM):**  
No I want your instructions first so I can organize, remove anything that isn't related to mvp, and work through the ui a bit before creating one.

I still need Hauska too just to be clear.

We should have an organization call

**Zain Jaffery (7:33 PM):**  
Understood, will do. Been working on Hauska app today. having dinner rn, will get you the instructions later tn or first thing tmr

Yes let's also have a sync up call for organization

---

## Key Decisions Summary

### Architecture
- ✅ Use IPFS for database (CID-based smart contracts requirement)
- ✅ Use Pinata (remove FuLa references)
- ⏸️ Defer full P2P/lens-platform real-time sync until after MVP
- ✅ Maintain tight RBAC with JWT-based auth and asset-based permissions

### Identity Verification
- ✅ Use **Persona** (user-friendly, fintech/real estate focused)

### E-Recording & Notary
- ✅ Use **Simplifile** (ICE Mortgage Technology)
- ✅ Recording function + notary functionality
- 🔗 API Portal: https://developer.ice.com/
- 📧 Login credentials provided

### Timeline
- 🎯 **2 weeks or less** for MVP launch

### Legal
- 📄 NDA and invention assignment agreement required
- 📄 Same documents needed for anyone helping

### Next Steps
- [ ] Zain to provide custom instructions for project folder
- [ ] Remove non-MVP related code
- [ ] Organize UI
- [ ] Create repo after instructions are ready
- [ ] Continue Hauska app work
- [ ] Schedule organization call
