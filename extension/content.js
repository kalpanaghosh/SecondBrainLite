chrome.runtime.sendMessage({ type: "CHECK_CREDENTIALS", url: window.location.href }, (response) => {
    if (response && response.matchFound) {
        const cred = response.credential;
        console.log("🌸 Second Brain Lite: Found credentials for", cred.websiteName);

        // Very basic heuristic for filling out login forms
        const attemptFill = () => {
            const passwordField = document.querySelector("input[type='password']");
            if (passwordField) {
                // Find nearest text or email input for the username
                // Many times the username input is right before the password input
                const allInputs = Array.from(document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel']"));
                
                // Try to find an input that is visible and likely a username field
                let usernameField = allInputs.find(i => 
                    i.name.toLowerCase().includes('user') || 
                    i.name.toLowerCase().includes('email') || 
                    i.name.toLowerCase().includes('login') ||
                    i.id.toLowerCase().includes('user') || 
                    i.id.toLowerCase().includes('email')
                );

                // Fallback to the first text/email input on the page if specific ones aren't found
                if (!usernameField && allInputs.length > 0) {
                    usernameField = allInputs[0];
                }

                if (usernameField && cred.username) {
                    usernameField.value = cred.username;
                    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                }

                if (passwordField && cred.password) {
                    passwordField.value = cred.password;
                    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                }

                console.log("🌸 Second Brain Lite: Autofilled credentials successfully.");
            }
        };

        // Try filling immediately and also after a short delay (for SPAs)
        attemptFill();
        setTimeout(attemptFill, 1500);
        setTimeout(attemptFill, 3000);
    }
});
