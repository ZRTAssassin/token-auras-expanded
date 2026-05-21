const Auras = {
	PERMISSIONS: ['all', 'limited', 'observer', 'owner', 'gm'],
	FLAG: 'token-auras-expanded',
	ENABLE_LOGGING_SETTING: 'enableLogging',
	debugFlags: function (message, data) {
		const setting = game.settings.get(this.FLAG, this.ENABLE_LOGGING_SETTING)
		if (setting) {
			if (data !== undefined) {
				console.log(message, data);
			} else {
				console.log(message);
			}
		}
	},
	debugActorFlags: function (actor) {
		const setting = game.settings.get(this.FLAG, this.ENABLE_LOGGING_SETTING)
		if (setting) {

			console.log("Actor flags:", {
				all: actor.flags,
				moduleFlags: actor.flags[Auras.FLAG],
				hiddenFlag: actor.getFlag(Auras.FLAG, 'hidden')
			});
		}
	},

	getAllAuras: function (doc) {
		return Auras.getManualAuras(doc).concat(doc.getFlag('token-auras-expanded', 'auras') || []);
	},

	getManualAuras: function (doc) {
		const aura1 = doc.getFlag('token-auras-expanded', 'aura1');
		const aura2 = doc.getFlag('token-auras-expanded', 'aura2');
		return [aura1 || Auras.newAura(), aura2 || Auras.newAura()];
	},

	newAura: function () {
		return {
			distance: null,
			colour: '#ffffff',
			opacity: 0.5,
			square: false,
			permission: 'all',
			uuid: Auras.uuid(),
			style: 'fill',
			lineWidth: 8,
			hideGM: false
		};
	},
	refreshActorTokens: function (actor) {
		if (!canvas.scene) return;
		canvas.scene.tokens.forEach(tokenDoc => {
			if (tokenDoc.actor?.id === actor.id && tokenDoc.object) {
				Auras.drawAuras(tokenDoc.object);
			}
		});
	},

	onConfigRender: function (config, html) {
		if (config.token?.tokenAuras) {
			config.token.tokenAuras.visible = false;
		}


		const auras = Auras.getManualAuras(config.document);

		// Expand the width
		const position = foundry.utils.deepClone(config.position);
		position.width = 540;
		config.setPosition(position);

		// Find the nav element
		const nav = html.querySelector('nav');
		if (!nav) {
			console.error("ZRT - Could not find nav element");
			return;
		}

		// Create and append the tab button
		const tabButton = document.createElement('a');
		tabButton.dataset.action = 'tab';
		tabButton.dataset.group = 'sheet';
		tabButton.dataset.tab = 'auras';
		tabButton.innerHTML = `
        <i class="fa-solid fa-dot-circle" inert=""></i>
        <span>${game.i18n.localize('AURAS.Auras')}</span>
    `;
		nav.appendChild(tabButton);

		const permissions = Auras.PERMISSIONS.map(perm => {
			let i18n = `OWNERSHIP.${perm.toUpperCase()}`;
			if (perm === 'all') i18n = 'AURAS.All';
			if (perm === 'gm') i18n = 'USER.RoleGamemaster';
			return { key: perm, label: game.i18n.localize(i18n) };
		});

		const auraConfig = auras.map((aura, idx) => `
        <div class="form-group">
            <label>${game.i18n.localize('AURAS.ShowTo')}</label>
            <select name="flags.token-auras-expanded.aura${idx + 1}.permission">
                ${permissions.map(option => `
                    <option value="${option.key}"
                            ${aura.permission === option.key ? 'selected' : ''}>
                        ${option.label}
                    </option>
                `).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>${game.i18n.localize('AURAS.HideGM')}</label>
            <input type="checkbox" name="flags.token-auras-expanded.aura${idx + 1}.hideGM"
                ${aura.hideGM ? 'checked' : ''}>
        </div>
        <div class="form-group">
            <label>${game.i18n.localize('AURAS.AuraColour')}</label>
            <div class="form-fields">
                <input class="color" type="text" value="${aura.colour}"
                       name="flags.token-auras-expanded.aura${idx + 1}.colour">
                <input type="color" value="${aura.colour}"
                       data-edit="flags.token-auras-expanded.aura${idx + 1}.colour">
            </div>
        </div>
        <div class="form-group">
            <label>
                ${game.i18n.localize('AURAS.Opacity')}
                <span class="units">(0 – 1)</span>
            </label>
            <input type="number" value="${aura.opacity}" step="any" min="0" max="1"
                   name="flags.token-auras-expanded.aura${idx + 1}.opacity">
        </div>
        <div class="form-group">
            <label>
    				${game.i18n.localize('Distance')}
    				<span class="units">(${canvas.scene.grid.units || 'units'})</span>
            </label>
            <input type="number" value="${aura.distance ? aura.distance : ''}" step="any"
                   name="flags.token-auras-expanded.aura${idx + 1}.distance" min="0">
        </div>
        <div class="form-group">
            <label>${game.i18n.localize('AURAS.Style')}</label>
            <select name="flags.token-auras-expanded.aura${idx + 1}.style">
                <option value="fill" ${aura.style === 'fill' ? 'selected' : ''}>Fill Only</option>
                <option value="line" ${aura.style === 'line' ? 'selected' : ''}>Line Only</option>
                <option value="both" ${aura.style === 'both' ? 'selected' : ''}>Fill and Line</option>
            </select>
        </div>
        <div class="form-group">
            <label>
                ${game.i18n.localize('AURAS.LineWidth')}
                <span class="units">(px)</span>
            </label>
            <input type="number" value="${aura.lineWidth}" step="1" min="1"
                name="flags.token-auras-expanded.aura${idx + 1}.lineWidth">
        </div>
        <div class="form-group">
            <label>${game.i18n.localize('Square')}</label>
            <input type="checkbox" name="flags.token-auras-expanded.aura${idx + 1}.square"
                   ${aura.square ? 'checked' : ''}>
        </div>
    `);

		// Create the tab content div
		const tabDiv = document.createElement('div');
		tabDiv.className = 'tab scrollable';
		tabDiv.dataset.group = 'sheet';
		tabDiv.dataset.tab = 'auras';
		tabDiv.dataset.applicationPart = 'auras';
		tabDiv.innerHTML = `
        ${auraConfig[0]}
        <hr>
        ${auraConfig[1]}
    `;

		// Insert before footer (footer is a sibling to nav, not inside nav.parentElement)
		const footer = html.querySelector('footer');
		if (footer) {
			footer.parentNode.insertBefore(tabDiv, footer);
		}

		// Handle all aura tab changes
		tabDiv.addEventListener('change', event => {
			const input = event.target;
			if (!input.matches('input, select')) return;

			const form = input.closest('form');
			if (!form) return;

			// Clear existing preview
			if (config.preview?.tokenAuras) {
				config.preview.tokenAuras.destroy();
				config.preview.tokenAuras = null;
			}

			const fd = new FormDataExtended(form);
			const updateData = fd.object;

			// Update the preview document
			for (const [k, v] of Object.entries(updateData)) {
				if (k.startsWith('flags.token-auras-expanded')) {
					foundry.utils.setProperty(config.document, k, v);
				}
			}

			// Redraw auras
			if (config.document.object) {
				Auras.drawAuras(config.document.object);
			}
		});

		// If no tab is active, trigger identity tab activation properly
		const activeTabs = html.querySelectorAll('a[data-action="tab"].active');

		if (activeTabs.length === 0) {
			// No active tab - activate identity through Foundry's system
			const identityTab = html.querySelector('a[data-tab="identity"]');
			if (identityTab) {
				identityTab.click();
			}
		}
	},

	uuid: function () {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
			.replace(/[018]/g, c =>
				(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
	},

	onRefreshToken: function (token) {
		if (token.tokenAuras) {
			const { x, y } = token.document;
			token.tokenAuras.position.set(x, y);
		}
	},

	onUpdateToken: function (token, changes) {
		const aurasUpdated =
			changes.flags?.['token-auras-expanded']
			&& ['aura1', 'aura2', 'auras'].some(k => typeof changes.flags['token-auras-expanded'][k] === 'object');

		const hiddenUpdated = "hidden" in changes;
		const sizeUpdated = "width" in changes || "height" in changes;

		if (aurasUpdated || hiddenUpdated || sizeUpdated) Auras.drawAuras(token.object);
	},

	toggleActorAuras: async function (actor) {
		const currentState = actor.getFlag(Auras.FLAG, 'hidden') || false;
		await actor.update({ [`flags.${Auras.FLAG}.hidden`]: !currentState });

		// Refresh all tokens for this actor
		for (let tokenDoc of canvas.scene.tokens) {
			if (tokenDoc.actor?.id === actor.id) {
				await tokenDoc.object.refresh();
			}
		}
	},

	drawAuras: function (token) {
		if (token.tokenAuras?.removeChildren) {
			token.tokenAuras.removeChildren().forEach(c => c.destroy());
		}

		if (token.document.hidden && !game.user.isGM) return;

		const allAuras = Auras.getAllAuras(token.document);

		// Compute AE overrides directly from the actor's active effects
		const aeOverrides = {};
		const actor = token.document.actor;
		if (actor) {
			for (const effect of actor.effects) {
				if (effect.disabled || effect.isSuppressed) continue;
				for (const change of effect.changes) {
					if (!change.key.startsWith("flags.token-auras-expanded.")) continue;
					const parts = change.key.split(".");
					const auraKey = parts[2];
					const prop = parts[3];
					if (!auraKey || !prop) continue;

					let value = change.value;
					// Parse numeric values
					if (!isNaN(value) && value !== '') value = Number(value);
					// Parse booleans
					if (value === 'true') value = true;
					if (value === 'false') value = false;

					foundry.utils.setProperty(aeOverrides, `${auraKey}.${prop}`, value);
				}
			}
		}

		// Merge overrides into manual auras
		if (aeOverrides.aura1) foundry.utils.mergeObject(allAuras[0], aeOverrides.aura1);
		if (aeOverrides.aura2) foundry.utils.mergeObject(allAuras[1], aeOverrides.aura2);

		// Create additional auras from AE overrides (aura3+)
		for (const [key, overrideProps] of Object.entries(aeOverrides)) {
			if (key === 'aura1' || key === 'aura2') continue;
			const newAura = Auras.newAura();
			foundry.utils.mergeObject(newAura, overrideProps);
			allAuras.push(newAura);
		}

		const auras = allAuras.filter(a => {
			if (token.document.actor?.getFlag(Auras.FLAG, 'hidden')) {
				Auras.debugFlags('[ZRT] Auras hidden by flag');
				return false;
			}
			if (!a.distance || (a.permission === 'gm' && !game.user.isGM)) return false;
			if (game.user.isGM && a.hideGM) return false;  // Add this line
			if (!a.permission || a.permission === 'all' || (a.permission === 'gm' && game.user.isGM)) return true;
			return !!token.document?.actor?.testUserPermission(game.user, a.permission.toUpperCase());
		});

		if (!auras.length) return;

		// Get the aura container from the appropriate layer
		if (!canvas.effects.tokenAuras) {
			canvas.effects.tokenAuras = new PIXI.Container();
			canvas.effects.addChild(canvas.effects.tokenAuras);
		}

		token.tokenAuras ??= canvas.effects.tokenAuras.addChild(new PIXI.Container());
		const gfx = token.tokenAuras.addChild(new PIXI.Graphics());
		const squareGrid = canvas.scene.grid.type === foundry.CONST.GRID_TYPES.SQUARE;
		const dim = canvas.dimensions;
		const unit = dim.size / dim.distance;
		const [cx, cy] = [token.w / 2, token.h / 2];
		const { width, height } = token.document;

		auras.forEach(aura => {
			let w, h;

			if (aura.square) {
				w = aura.distance * 2 + (width * dim.distance);
				h = aura.distance * 2 + (height * dim.distance);
			} else {
				[w, h] = [aura.distance, aura.distance];

				if (squareGrid) {
					w += width * dim.distance / 2;
					h += height * dim.distance / 2;
				} else {
					w += (width - 1) * dim.distance / 2;
					h += (height - 1) * dim.distance / 2;
				}
			}

			w *= unit;
			h *= unit;

			// Convert the color using foundry's ColorManager
			const colorValue = foundry.utils.Color.from(aura.colour);

			if (aura.style === 'fill' || aura.style === 'both') {
				gfx.beginFill(colorValue, aura.opacity);
			}

			if (aura.style === 'line' || aura.style === 'both') {
				if (!aura.lineWidth) {
					aura.lineWidth = 8;
				}
				gfx.lineStyle(aura.lineWidth, colorValue, aura.opacity);
			}

			// gfx.beginFill(colorValue, aura.opacity);
			// gfx.lineStyle(8, colorValue, aura.opacity);

			if (aura.square) {
				const [x, y] = [cx - w / 2, cy - h / 2];
				gfx.drawRect(x, y, w, h);
			} else {
				gfx.drawEllipse(cx, cy, w, h);
			}

			gfx.endFill();
		});
	}
};

const InspirationReroll = {
	SETTING: 'enableInspirationReroll',

	isDnd5e: function () {
		return game.system.id === 'dnd5e';
	},

	isEnabled: function () {
		return game.settings.get(Auras.FLAG, InspirationReroll.SETTING);
	},

	getActorFromMessage: function (message) {
		const speaker = message.speaker;
		if (!speaker?.actor) return null;

		if (speaker.scene && speaker.token) {
			const scene = game.scenes.get(speaker.scene);
			const tokenDoc = scene?.tokens?.get(speaker.token);
			if (tokenDoc?.actor) return tokenDoc.actor;
		}

		return game.actors.get(speaker.actor) || null;
	},

	hasInspiration: function (actor) {
		return !!actor?.system?.attributes?.inspiration;
	},

	consumeInspiration: async function (actor) {
		await actor.update({ 'system.attributes.inspiration': false });
	},

	getD20Results: function (message) {
		const results = [];
		if (!message.rolls?.length) return results;

		for (let rIdx = 0; rIdx < message.rolls.length; rIdx++) {
			const roll = message.rolls[rIdx];
			if (!roll.terms) continue;

			for (let tIdx = 0; tIdx < roll.terms.length; tIdx++) {
				const term = roll.terms[tIdx];
				if (term.faces !== 20 || !term.results) continue;

				for (let dIdx = 0; dIdx < term.results.length; dIdx++) {
					const res = term.results[dIdx];
					results.push({
						rollIdx: rIdx,
						termIdx: tIdx,
						resultIdx: dIdx,
						value: res.result,
						active: res.active !== false
					});
				}
			}
		}
		return results;
	},

	performReroll: async function (message, d20Results, selectedIndex) {
		const actor = InspirationReroll.getActorFromMessage(message);
		if (!actor) {
			ui.notifications.error("Could not determine the actor for this roll.");
			return;
		}

		if (!InspirationReroll.hasInspiration(actor)) {
			ui.notifications.warn(`${actor.name} does not have Inspiration.`);
			return;
		}

		const originalRoll = message.rolls[d20Results[selectedIndex].rollIdx];
		const originalFlavor = message.flavor || '';
		let newRoll;
		let rerollNote;

		if (d20Results.length === 1) {
			const rollData = actor.getRollData?.() || {};
			newRoll = new Roll(originalRoll.formula, rollData);
			await newRoll.evaluate();
			rerollNote = `<strong>Inspiration Reroll</strong> (original: ${originalRoll.total})`;
		} else {
			const selected = d20Results[selectedIndex];
			const oldValue = selected.value;

			const freshDie = new Roll('1d20');
			await freshDie.evaluate();
			const newValue = freshDie.total;

			const rollJSON = JSON.stringify(originalRoll.toJSON());
			const rollData = JSON.parse(rollJSON);

			const d20TermData = rollData.terms[selected.termIdx];
			d20TermData.results[selected.resultIdx].result = newValue;

			InspirationReroll._reapplyKeepModifiers(d20TermData);

			rollData.total = InspirationReroll._recalculateTotal(rollData.terms);

			newRoll = Roll.fromData(rollData);
			newRoll._total = rollData.total;

			rerollNote = `<strong>Inspiration Reroll</strong> (die ${selectedIndex + 1}: ${oldValue} -> ${newValue}, original total: ${originalRoll.total})`;
		}

		await InspirationReroll.consumeInspiration(actor);

		const messageData = {
			speaker: message.speaker,
			flavor: `${originalFlavor}${originalFlavor ? '<br>' : ''}${rerollNote}`,
			rolls: [newRoll],
			flags: {
				[Auras.FLAG]: {
					inspirationReroll: true,
					originalMessageId: message.id
				}
			}
		};

		await ChatMessage.create(messageData);
		console.log(`[ZRT] Inspiration reroll by ${actor.name}: original total ${originalRoll.total}, new total ${newRoll.total}`);
	},

	_reapplyKeepModifiers: function (termData) {
		if (!termData.modifiers || !termData.results || termData.results.length < 2) return;

		const modString = termData.modifiers.join(',').toLowerCase();
		const hasKeepHighest = /kh/.test(modString);
		const hasKeepLowest = /kl/.test(modString);

		if (!hasKeepHighest && !hasKeepLowest) return;

		termData.results.forEach(r => {
			r.active = true;
			r.discarded = false;
		});

		const indexed = termData.results.map((r, i) => ({ result: r.result, idx: i }));

		if (hasKeepHighest) {
			indexed.sort((a, b) => b.result - a.result);
		} else {
			indexed.sort((a, b) => a.result - b.result);
		}

		for (let i = 1; i < indexed.length; i++) {
			const target = termData.results[indexed[i].idx];
			target.active = false;
			target.discarded = true;
		}
	},

	_recalculateTotal: function (terms) {
		let total = 0;
		let operator = '+';

		for (const term of terms) {
			let termValue = 0;

			if (term.class === 'Die' || (term.results && term.faces)) {
				termValue = (term.results || [])
					.filter(r => r.active !== false)
					.reduce((sum, r) => sum + r.result, 0);
			} else if (term.class === 'NumericTerm' || typeof term.number === 'number') {
				termValue = term.number;
			} else if (term.class === 'OperatorTerm' || term.operator) {
				operator = term.operator;
				continue;
			} else {
				continue;
			}

			if (operator === '+') total += termValue;
			else if (operator === '-') total -= termValue;
			else if (operator === '*') total *= termValue;
			else if (operator === '/') total /= termValue;

			operator = '+';
		}

		return total;
	},

	showRerollDialog: async function (message, d20Results) {
		const dieButtons = {};

		d20Results.forEach((d, idx) => {
			const label = `Die ${idx + 1}: ${d.value}${d.active ? '' : ' (discarded)'}`;
			dieButtons[`die${idx}`] = {
				label: label,
				icon: '<i class="fas fa-dice-d20"></i>',
				callback: () => InspirationReroll.performReroll(message, d20Results, idx)
			};
		});

		dieButtons.cancel = {
			label: 'Cancel',
			icon: '<i class="fas fa-times"></i>'
		};

		new Dialog({
			title: 'Inspiration Reroll',
			content: '<p>This roll has multiple d20s. Which die do you want to reroll?</p>',
			buttons: dieButtons,
			default: 'cancel'
		}).render(true);
	},

	handleReroll: async function (message) {
		const d20Results = InspirationReroll.getD20Results(message);

		if (d20Results.length === 0) {
			ui.notifications.warn("No d20 found in this roll.");
			return;
		}

		if (d20Results.length === 1) {
			await InspirationReroll.performReroll(message, d20Results, 0);
		} else {
			InspirationReroll.showRerollDialog(message, d20Results);
		}
	}
};

Hooks.once('init', () => {
	game.settings.register(Auras.FLAG, Auras.ENABLE_LOGGING_SETTING, {
		name: 'Enable Debug Logging',
		hint: 'Enable console logging for debugging purposes',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false
	});

	game.settings.register(Auras.FLAG, InspirationReroll.SETTING, {
		name: 'Enable Inspiration Reroll',
		hint: 'Adds a right-click context menu option on chat roll messages to reroll a d20 using D&D 5e Inspiration. Only functional when the dnd5e system is active.',
		scope: 'world',
		config: true,
		type: Boolean,
		default: true
	});
});

Hooks.on('renderTokenHUD', (hud, html, token) => {
	const tokenDoc = canvas.tokens.get(token._id)?.document;
	const controlledActor = tokenDoc?.actor;

	if (!controlledActor || !controlledActor.flags) return;

	const hasOwnerPermission = controlledActor.testUserPermission(game.user, "OWNER");
	Auras.debugFlags("Is Owner:", hasOwnerPermission);

	if (!game.user.isGM && !hasOwnerPermission) return;
	Auras.debugFlags("[ZRT] force hud render");


	const hidden = controlledActor.getFlag(Auras.FLAG, 'hidden');

	// Create the button element
	const tokenHudButton = document.createElement('div');
	tokenHudButton.className = `control-icon${hidden ? '' : ' active'}`;
	tokenHudButton.dataset.action = 'toggle-auras';
	tokenHudButton.title = 'Toggle aura visibility';
	tokenHudButton.innerHTML = '<i class="fas fa-ring"></i>';

	// Append to the right column
	const rightCol = html.querySelector('.col.right');
	if (rightCol) {
		rightCol.appendChild(tokenHudButton);
	}

	tokenHudButton.addEventListener('click', async () => {
		Auras.debugFlags(controlledActor);

		await Auras.toggleActorAuras(controlledActor);

		hud.render();
	});

});

// Register hooks
Hooks.on('renderTokenConfig', Auras.onConfigRender);
Hooks.on('drawToken', Auras.drawAuras);
Hooks.on('refreshToken', Auras.onRefreshToken);
Hooks.on('updateToken', Auras.onUpdateToken);


// restore aura when closing.
Hooks.on('closeTokenConfig', (config) => {
	if (config.token?.tokenAuras) {
		config.token.tokenAuras.visible = true;
	}
});

Hooks.on('destroyToken', token => token.tokenAuras?.destroy());


Hooks.on('updateActor', (actor, changes) => {
	Auras.debugFlags('[ZRT] Actor Updated:', {
		actor: actor.id,
		changes: changes,
		hasHiddenChange: changes.flags?.[Auras.FLAG]?.hidden !== undefined
	});
	if (changes.flags?.[Auras.FLAG]?.hidden !== undefined) {
		Auras.refreshActorTokens(actor);
	}
});


Hooks.on("createActiveEffect", (effect, options, userId) => {
	const actor = effect.parent;
	if (!(actor instanceof Actor)) return;
	Auras.refreshActorTokens(actor);
});

Hooks.on("deleteActiveEffect", (effect, options, userId) => {
	const actor = effect.parent;
	if (!(actor instanceof Actor)) return;
	Auras.refreshActorTokens(actor);
});

Hooks.on("updateActiveEffect", (effect, changes, options, userId) => {
	const actor = effect.parent;
	if (!(actor instanceof Actor)) return;
	Auras.refreshActorTokens(actor);
});

Hooks.on('getChatMessageContextOptions', (html, options) => {
	if (!InspirationReroll.isDnd5e()) return;
	if (!InspirationReroll.isEnabled()) return;

	// Reroll option (only on messages that haven't been rerolled yet)
	options.push({
		name: 'Reroll with Inspiration',
		icon: '<i class="fas fa-dice-d20"></i>',
		condition: li => {
			const messageId = li.dataset.messageId;
			const message = game.messages.get(messageId);
			if (!message) return false;
			if (message.getFlag(Auras.FLAG, 'inspirationReroll')) return false;

			const d20Results = InspirationReroll.getD20Results(message);
			if (d20Results.length === 0) return false;

			const actor = InspirationReroll.getActorFromMessage(message);
			if (!actor) return false;
			if (!InspirationReroll.hasInspiration(actor)) return false;

			const isAuthor = message.author?.id === game.user.id;
			const isOwner = actor.testUserPermission(game.user, 'OWNER');
			const isGM = game.user.isGM;
			return isAuthor || isOwner || isGM;
		},
		callback: li => {
			const messageId = li.dataset.messageId;
			const message = game.messages.get(messageId);
			if (message) InspirationReroll.handleReroll(message);
		}
	});

	// Disabled entry shown on already-rerolled messages
	options.push({
		name: 'Already Rerolled with Inspiration',
		icon: '<i class="fas fa-dice-d20"></i>',
		condition: li => {
			const messageId = li.dataset.messageId;
			const message = game.messages.get(messageId);
			if (!message) return false;
			return !!message.getFlag(Auras.FLAG, 'inspirationReroll');
		},
		callback: () => {
			ui.notifications.info("This roll was already rerolled with Inspiration and can't be rerolled again.");
		}
	});
});