/**
 * Littlepay Checkout SDK v2 - MIT registerCard Demo Playground
 */

// State variables
let littlePayInstance = null;

// DOM Elements
const configForm = document.getElementById('sdk-config-form');
const tokenModeSelect = document.getElementById('tokenMode');
const checkoutMethodSelect = document.getElementById('checkoutMethod');
const autoTokenFields = document.getElementById('auto-token-fields');
const manualTokenField = document.getElementById('manual-token-field');

// Mode Inputs
const customerRefInput = document.getElementById('customerRef');
const orderAmountInput = document.getElementById('orderAmount');
const orderCurrencyInput = document.getElementById('orderCurrency');
const metadataRefInput = document.getElementById('metadataRef');
const mitTypeSelect = document.getElementById('mitType');
const clientTokenInput = document.getElementById('clientToken');

// Theme Elements
const primaryColorInput = document.getElementById('primaryColor');
const bgColorInput = document.getElementById('bgColor');
const buttonBgInput = document.getElementById('buttonBg');
const buttonColorInput = document.getElementById('buttonColor');
const borderRadiusInput = document.getElementById('borderRadius');
const fontFamilySelect = document.getElementById('fontFamily');

// UI Controls
const submitBtn = document.getElementById('btn-submit');
const unmountBtn = document.getElementById('btn-unmount');
const clearLogsBtn = document.getElementById('btn-clear-logs');
const logsContainer = document.getElementById('logs-container');
const sdkPlaceholder = document.getElementById('sdk-placeholder');
const sdkContainer = document.getElementById('littlepay-dropin-ui');

// Settings
const localeSelect = document.getElementById('locale');
const labelPositionSelect = document.getElementById('labelPosition');
const cardholderDetailSelect = document.getElementById('cardholderDetailFields');
const disableSavedSelect = document.getElementById('disableSavedCards');

/**
 * Utility to log messages into our simulated console log view
 */
function log(message, type = 'system') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-timestamp';
    timeSpan.textContent = `[${timestamp}]`;
    
    entry.appendChild(timeSpan);
    entry.appendChild(document.createTextNode(` ${message}`));
    
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

/**
 * Synchronizes color pickers text displays
 */
function setupColorPickers() {
    const colorPickers = [
        primaryColorInput,
        bgColorInput,
        buttonBgInput,
        buttonColorInput
    ];
    
    colorPickers.forEach(picker => {
        if (!picker) return;
        picker.addEventListener('input', (e) => {
            const valSpan = picker.nextElementSibling;
            if (valSpan && valSpan.classList.contains('color-value')) {
                valSpan.textContent = e.target.value.toUpperCase();
            }
        });
    });
}

/**
 * Handle Switching between Automatic API Token Mode and Manual Input Mode
 */
function handleTokenModeChange() {
    const mode = tokenModeSelect.value;
    log(`[System] Token mode switched to: ${mode === 'auto' ? 'Automatic API Generation' : 'Manual Token Input'}`, 'system');

    if (mode === 'auto') {
        autoTokenFields.classList.remove('hidden');
        manualTokenField.classList.add('hidden');
        
        // Update required statuses
        clientTokenInput.required = false;
        
        updateSubmitButtonText();
    } else {
        autoTokenFields.classList.add('hidden');
        manualTokenField.classList.remove('hidden');
        
        // Update required statuses
        clientTokenInput.required = true;
        
        submitBtn.textContent = 'Initialize SDK & Register Card';
    }
}

/**
 * Updates Submit button based on chosen checkout method
 */
function updateSubmitButtonText() {
    if (tokenModeSelect.value === 'manual') return;
    
    const method = checkoutMethodSelect.value;
    if (method === 'link') {
        submitBtn.textContent = 'Generate Payment Link';
    } else {
        submitBtn.textContent = 'Generate Token & Register Card';
    }
}

/**
 * Clears and unmounts the previous SDK instance safely
 */
function cleanupExistingSession() {
    if (littlePayInstance) {
        log('[System] Cleaning up previous SDK instance...', 'system');
        try {
            littlePayInstance.unmount();
            log('[System] Previous SDK instance successfully unmounted.', 'success');
        } catch (err) {
            log(`[System] Warning on unmount: ${err.message}`, 'error');
        }
        littlePayInstance = null;
    }
}

/**
 * Builds the theme and layout parameters for SDK mode
 */
function buildSdkConfig(clientToken) {
    const primaryColor = primaryColorInput.value;
    const bgColor = bgColorInput.value;
    const buttonBg = buttonBgInput.value;
    const buttonColor = buttonColorInput.value;
    const borderRadius = borderRadiusInput.value || '4px';
    const fontFamily = fontFamilySelect.value;
    const locale = localeSelect.value;
    const labelPosition = labelPositionSelect.value;
    const cardholderDetailFields = cardholderDetailSelect.value;
    const disableSavedCards = disableSavedSelect.value === 'true';

    return {
        clientToken: clientToken.trim(),
        targetElementId: 'littlepay-dropin-ui',
        locale: locale,
        options: {
            disableSavedCards: disableSavedCards,
            cardholderDetailFields: cardholderDetailFields,
            theme: {
                color: primaryColor,
                backgroundColor: bgColor,
                fontFamily: fontFamily,
                labelPosition: labelPosition,
                loadingScreen: {
                    color: buttonBg,
                    backgroundColor: bgColor,
                },
                button: {
                    color: buttonColor,
                    backgroundColor: buttonBg,
                    borderRadius: borderRadius,
                },
                errorMessage: {
                    color: '#ffffff',
                    backgroundColor: '#e53e3e',
                },
                navigationBar: {
                    color: primaryColor,
                    backgroundColor: bgColor,
                },
                input: {
                    borderRadius: '6px',
                    borderWidth: '1px',
                    color: primaryColor,
                    backgroundColor: bgColor
                }
            }
        }
    };
}

/**
 * Communicates with our zero-dependency backend proxy to construct a secure checkout session
 */
async function createCheckoutSession() {
    const customerRef = customerRefInput.value.trim() || '1';
    const amount = parseInt(orderAmountInput.value.trim(), 10) || 811;
    const currency = orderCurrencyInput.value.trim() || 'EUR';
    const metadataRef = metadataRefInput.value.trim() || 'test-Tung';
    const mitType = mitTypeSelect.value;
    const checkoutMethod = checkoutMethodSelect.value;
    const disableSavedCards = disableSavedSelect.value === 'true';

    log(`[Proxy API] Initializing payload for secure local proxy (/api/create-session) in ${checkoutMethod.toUpperCase()} mode...`, 'system');
    
    const payload = {
        mitType: mitType,
        checkoutMethod: checkoutMethod,
        disableSavedCards: disableSavedCards,
        locale: localeSelect.value,
        orderPayload: {
            customer_ref: customerRef,
            charge: {
                amount: amount,
                currency: currency
            },
            metadata: {
                reference: metadataRef
            }
        }
    };

    try {
        const proxyResponse = await fetch('/api/create-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!proxyResponse.ok) {
            const errText = await proxyResponse.text();
            let parsedErr;
            try {
                parsedErr = JSON.parse(errText).error;
            } catch(e) {
                parsedErr = errText;
            }
            throw new Error(parsedErr || proxyResponse.statusText);
        }

        const sessionData = await proxyResponse.json();
        log(`[Proxy API] Session successfully registered via secure local backend proxy!`, 'success');
        
        return sessionData;

    } catch (err) {
        log(`[Proxy API Error] Local proxy server request failed: ${err.message}`, 'error');
        throw err;
    }
}

/**
 * Activates Simulation Mode Fallback manually or automatically
 */
function enableSimulationMode() {
    log('[System] Activating interactive Simulation Mode Fallback...', 'system');
    
    const statusText = document.querySelector('.status-text');
    const statusDot = document.querySelector('.status-dot');
    if (statusText) {
        statusText.textContent = 'Simulation Mode (Offline)';
        statusText.style.color = '#f59e0b';
    }
    if (statusDot) {
        statusDot.style.backgroundColor = '#f59e0b';
        statusDot.style.boxShadow = '0 0 8px #f59e0b';
    }

    // Assign mock LittlePay object
    window.LittlePay = function(config) {
        log('[Simulated SDK] window.LittlePay initialized with playground config.', 'callback');
        
        let mounted = true;
        const targetElement = document.getElementById(config.targetElementId);

        return {
            registerCard: function(errorCallback, successCallback) {
                if (!mounted) {
                    log('[Simulated SDK] Error: registerCard called on unmounted instance.', 'error');
                    return;
                }
                log('[Simulated SDK] Rendering custom simulated card form...', 'system');
                
                const btnBg = config.options?.theme?.button?.backgroundColor || '#ed7625';
                const btnColor = config.options?.theme?.button?.color || '#ffffff';
                const btnRadius = config.options?.theme?.button?.borderRadius || '6px';
                const textColor = config.options?.theme?.color || '#2d3748';
                const bgColor = config.options?.theme?.backgroundColor || '#ffffff';
                const extraFields = config.options?.cardholderDetailFields || 'HIDE';

                targetElement.innerHTML = `
                    <div class="mock-sdk-form" style="background-color: ${bgColor}; color: ${textColor}; padding: 24px; border-radius: 8px; font-family: ${config.options?.theme?.fontFamily || 'inherit'}; box-shadow: var(--shadow-sm); animation: fadeIn 0.3s ease; border: 1px solid var(--border-color); text-align: left;">
                        <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; color: ${textColor};">
                            <span style="display: flex; align-items: center; gap: 6px;">🔒 Secure Card Details</span>
                            <span style="font-size: 0.65rem; background: #feebc8; color: #c05621; padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Simulated Form</span>
                        </h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: ${textColor};">Cardholder Name</label>
                            <input type="text" id="mock-cardname" placeholder="John Doe" value="John Doe" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; color: ${textColor}; background-color: ${bgColor}; width: 100%;">
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: ${textColor};">Card Number</label>
                            <input type="text" id="mock-cardnumber" placeholder="4111 1111 1111 1111" value="4111 1111 1111 1111" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; color: ${textColor}; background-color: ${bgColor}; width: 100%;">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; font-weight: 600; color: ${textColor};">Expiry (MM/YY)</label>
                                <input type="text" id="mock-expiry" placeholder="12/29" value="12/29" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; color: ${textColor}; background-color: ${bgColor}; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; font-weight: 600; color: ${textColor};">CVV</label>
                                <input type="text" id="mock-cvv" placeholder="123" value="123" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; color: ${textColor}; background-color: ${bgColor}; width: 100%;">
                            </div>
                        </div>

                        ${extraFields === 'DISPLAY' ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; border-top: 1px dashed var(--border-color); padding-top: 16px;">
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; font-weight: 600; color: ${textColor};">Email Address</label>
                                <input type="text" id="mock-email" placeholder="customer@example.com" value="customer@example.com" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; color: ${textColor}; background-color: ${bgColor}; width: 100%;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <label style="font-size: 0.8rem; font-weight: 600; color: ${textColor};">Phone Number</label>
                                <input type="text" id="mock-phone" placeholder="+44 7700 900077" value="+44 7700 900077" style="padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; color: ${textColor}; background-color: ${bgColor}; width: 100%;">
                            </div>
                        </div>
                        ` : ''}

                        <button id="btn-mock-submit" style="background-color: ${btnBg}; color: ${btnColor}; border-radius: ${btnRadius}; width: 100%; padding: 12px; font-weight: 600; font-size: 0.9rem; border: none; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>Register Card</span>
                        </button>
                    </div>
                `;

                const submitBtn = document.getElementById('btn-mock-submit');
                submitBtn.addEventListener('click', () => {
                    log('[Simulated SDK] Submit clicked. Initiating secure register transaction...', 'callback');
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.75';
                    submitBtn.innerHTML = `
                        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        <span>Processing Securely...</span>
                    `;
                    
                    if (!document.getElementById('spinner-style')) {
                        const styleNode = document.createElement('style');
                        styleNode.id = 'spinner-style';
                        styleNode.textContent = `
                            @keyframes spin { 100% { transform: rotate(360deg); } }
                            @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                        `;
                        document.head.appendChild(styleNode);
                    }
                    
                    setTimeout(() => {
                        const mockPaymentIntentId = 'pi_sim_' + Math.random().toString(36).substring(2, 15);
                        log(`[Simulated SDK] Card successfully registered. Generated Payment Intent: ${mockPaymentIntentId}`, 'success');
                        log('[Simulated SDK] Triggering successCallback().', 'callback');
                        successCallback(mockPaymentIntentId);
                    }, 1500);
                });
            },
            unmount: function() {
                mounted = false;
                targetElement.innerHTML = '';
                log('[Simulated SDK] unmount() called. Resources cleaned up.', 'system');
            }
        };
    };
}

/**
 * High-level form submission handler
 */
async function initializeSdkFlow(e) {
    e.preventDefault();
    
    let sessionData = null;
    const mode = tokenModeSelect.value;
    const chosenMethod = checkoutMethodSelect.value;
    
    // UI Loading state
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Preparing Session...';

    cleanupExistingSession();

    if (mode === 'manual') {
        const clientToken = clientTokenInput.value.trim();
        if (!clientToken) {
            log('[Error] Client Token is required for manual initialization.', 'error');
            alert('Please paste a valid Client Token first.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }
        // Construct standard SDK fallback for manual token inputs
        sessionData = {
            checkoutMethod: 'sdk',
            client_token: clientToken,
            id: 'manual-order',
            payment_intent_id: 'manual-intent'
        };
    } else {
        // Mode is Auto-Fetch
        try {
            sessionData = await createCheckoutSession();
        } catch (apiError) {
            // Ask user if they wish to transition to Simulation Mode
            const proceedSimulation = confirm(
                `Failed to auto-generate token:\n"${apiError.message}"\n\nWould you like to launch the simulated checkout flow instead?`
            );
            
            if (proceedSimulation) {
                log('[System] User agreed to fallback. Switching to simulation configuration.', 'system');
                enableSimulationMode();
                sessionData = {
                    checkoutMethod: chosenMethod,
                    client_token: 'simulated_client_token_placeholder',
                    url: 'https://checkout.sandbox.littlepay.com/simulated-hosted-checkout'
                };
            } else {
                log('[System] Automatic setup aborted.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }
        }
    }

    // Reset UI Panel
    sdkPlaceholder.classList.add('hidden');
    sdkContainer.classList.remove('hidden');
    sdkContainer.innerHTML = '';

    // ==========================================
    // ROUTE A: PAYMENT LINK (Hosted Redirection)
    // ==========================================
    if (sessionData.checkoutMethod === 'link') {
        log(`[System] Payment Link checkout flow initiated. Rendering redirection view.`, 'system');
        log(`[System] Final Link: ${sessionData.url}`, 'success');

        sdkContainer.innerHTML = `
            <div class="payment-link-card" style="text-align: center; padding: 40px 20px; animation: fadeIn 0.4s ease-out; font-family: var(--font-sans);">
                <div style="font-size: 3.5rem; margin-bottom: 16px; color: var(--primary);">🔗</div>
                <h3 style="color: var(--text-main); font-weight: 700; margin-bottom: 8px;">Payment Link Generated!</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 24px;">Your hosted checkout payment link is ready for secure card registration.</p>
                
                <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                    <input type="text" id="pl-url-input" value="${sessionData.url}" readonly style="flex-grow: 1; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 0.75rem; background-color: #f8fafc; color: var(--text-main);">
                    <button id="btn-pl-copy" class="btn btn-secondary btn-sm" style="width: auto; padding: 10px 16px; font-size: 0.85rem; border-radius: var(--radius-md);">Copy</button>
                </div>

                <button id="btn-pl-open" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 0.95rem; border-radius: var(--radius-md); background-color: var(--primary); font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>Open Hosted Checkout</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </button>
            </div>
        `;

        // Copy button event
        const copyBtn = document.getElementById('btn-pl-copy');
        copyBtn.addEventListener('click', () => {
            const urlInput = document.getElementById('pl-url-input');
            urlInput.select();
            document.execCommand('copy');
            log('[System] Payment link URL copied to clipboard.', 'success');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        });

        // Open button event
        const openBtn = document.getElementById('btn-pl-open');
        openBtn.addEventListener('click', () => {
            log('[System] Redirecting customer to hosted payment page in a new tab...', 'system');
            window.open(sessionData.url, '_blank');
        });

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        return;
    }

    // ==========================================
    // ROUTE B: INLINE SDK (Direct Mount Form)
    // ==========================================
    if (typeof window.LittlePay !== 'function') {
        enableSimulationMode();
    }

    // Generate configuration for the SDK
    const config = buildSdkConfig(sessionData.client_token);
    log('[System] Initializing window.LittlePay() with configuration...', 'system');

    try {
        littlePayInstance = window.LittlePay(config);
        log('[System] Littlepay SDK Instance created successfully.', 'success');
        unmountBtn.disabled = false;
        
        const errorCallback = (error) => {
            log(`[Callback] errorCallback fired: ${JSON.stringify(error)}`, 'error');
            console.error('Littlepay SDK Error callback:', error);
        };
        
        const successCallback = (paymentIntentId) => {
            log(`[Callback] successCallback fired with ID: ${paymentIntentId}`, 'success');
            log('[System] Stored Payment Method registered successfully! Card saved.', 'success');
            
            cleanupExistingSession();
            unmountBtn.disabled = true;
            
            sdkContainer.innerHTML = `
                <div class="card-success-message" style="text-align: center; padding: 40px 20px; animation: fadeIn 0.4s ease-out;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
                    <h3 style="color: var(--success); font-weight: 700; margin-bottom: 8px;">Registration Successful!</h3>
                    <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 16px;">The stored payment method was registered securely.</p>
                    <div style="background-color: var(--success-light); color: var(--success); border: 1px solid rgba(56, 161, 105, 0.2); font-family: var(--font-mono); font-size: 0.75rem; padding: 12px; border-radius: var(--radius-md); word-break: break-all; text-align: left;">
                        <strong>Payment Intent ID:</strong><br>${paymentIntentId}
                    </div>
                </div>
            `;
        };

        log('[System] Launching registerCard() flow...', 'system');
        littlePayInstance.registerCard(errorCallback, successCallback);
        log('[System] registerCard() form rendering within target container.', 'system');

    } catch (err) {
        log(`[System] Initialisation Error: ${err.message}`, 'error');
        console.error('Initialization failure:', err);
        sdkPlaceholder.classList.remove('hidden');
        sdkContainer.classList.add('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Attach Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setupColorPickers();
    
    // Attach token mode toggling listener
    tokenModeSelect.addEventListener('change', handleTokenModeChange);
    
    // Attach checkout method change listener
    checkoutMethodSelect.addEventListener('change', updateSubmitButtonText);
    
    handleTokenModeChange(); // Run once to sync initial state
    
    // Check script load status immediately on page load
    if (typeof window.LittlePay !== 'function') {
        enableSimulationMode();
    }
    
    configForm.addEventListener('submit', initializeSdkFlow);
    
    unmountBtn.addEventListener('click', () => {
        cleanupExistingSession();
        unmountBtn.disabled = true;
        sdkPlaceholder.classList.remove('hidden');
        sdkContainer.classList.add('hidden');
        sdkContainer.innerHTML = '';
    });
    
    clearLogsBtn.addEventListener('click', () => {
        logsContainer.innerHTML = '';
        log('[System] Logs cleared.', 'system');
    });
    
    log('[System] Demo playground ready. Configure theme or input a token to start.', 'system');
});
