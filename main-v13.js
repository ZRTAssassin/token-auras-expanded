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

		const auras = Auras.getAllAuras(token.document).filter(a => {
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

Hooks.once('init', () => {
	game.settings.register(Auras.FLAG, Auras.ENABLE_LOGGING_SETTING, {
		name: 'Enable Debug Logging',
		hint: 'Enable console logging for debugging purposes',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false
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

// Initialize the aura container when the effects layer is ready
Hooks.on('canvasInit', () => {
	if (!canvas.effects) return;
	canvas.effects.tokenAuras = new PIXI.Container();
	canvas.effects.addChild(canvas.effects.tokenAuras);
});
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
		canvas.scene.tokens.forEach(tokenDoc => {
			if (tokenDoc.actor?.id === actor.id) {
				Auras.debugFlags('[ZRT] Refreshing token due to actor update:', tokenDoc.id);
				Auras.drawAuras(tokenDoc.object);
			}
		});
	}
});

//CONFIG.debug.hooks=true
//Hooks.events