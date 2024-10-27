const Auras = {
	PERMISSIONS: ['all', 'limited', 'observer', 'owner', 'gm'],
	FLAG: 'token-auras-expanded',
	debugFlags: function (actor) {
		console.log("Actor flags:", {
			all: actor.flags,
			moduleFlags: actor.flags[this.FLAG],
			hiddenFlag: actor.getFlag(this.FLAG, 'hidden')
		});
	},


	getAllAuras: function (doc) {
		return Auras.getManualAuras(doc).concat(doc.getFlag(Auras.FLAG, 'auras') || []);
	},

	getManualAuras: function (doc) {
		let aura1 = doc.getFlag(Auras.FLAG, 'aura1');
		let aura2 = doc.getFlag(Auras.FLAG, 'aura2');
		return [aura1 || Auras.newAura(), aura2 || Auras.newAura()];
	},

	newAura: function () {
		return {
			distance: null,
			colour: '#ffffff',
			opacity: .5,
			square: false,
			permission: 'all',
			uuid: Auras.uuid(),
			style: 'fill',
			lineWidth: 8,
			hideGM: false
		};
	},

	onConfigRender: function (config, html) {
		const auras = Auras.getManualAuras(config.token);

		// Expand the width
		config.position.width = 540;
		config.setPosition(config.position);

		const nav = html.find('nav.sheet-tabs.tabs[data-group="main"]');
		nav.append($(`
			<a class="item" data-tab="auras">
				<i class="far fa-dot-circle"></i>
				${game.i18n.localize('AURAS.Auras')}
			</a>
		`));

		const permissions = Auras.PERMISSIONS.map(perm => {
			let i18n = `OWNERSHIP.${perm.toUpperCase()}`;
			if (perm === 'all') {
				i18n = 'AURAS.All';
			}

			if (perm === 'gm') {
				i18n = 'USER.RoleGamemaster';
			}

			return { key: perm, label: game.i18n.localize(i18n) };
		});

		const auraConfig = auras.map((aura, idx) => `
			<div class="form-group">
				<label>${game.i18n.localize('AURAS.ShowTo')}</label>
				<select name="flags.${Auras.FLAG}.aura${idx + 1}.permission">
					${permissions.map(option => `
						<option value="${option.key}"
						        ${aura.permission === option.key ? 'selected' : ''}>
							${option.label}
						</option>
					`)}
				</select>
			</div>
			<div class="form-group">
				<label>${game.i18n.localize('AURAS.HideGM')}</label>
				<input type="checkbox" name="flags.${Auras.FLAG}.aura${idx + 1}.hideGM"
					${aura.hideGM ? 'checked' : ''}>
			</div>
			<div class="form-group">
				<label>${game.i18n.localize('AURAS.AuraColour')}</label>
				<div class="form-fields">
					<input class="color" type="text" value="${aura.colour}"
					       name="flags.${Auras.FLAG}.aura${idx + 1}.colour">
					<input type="color" value="${aura.colour}"
					       data-edit="flags.${Auras.FLAG}.aura${idx + 1}.colour">
				</div>
			</div>
			<div class="form-group">
				<label>
					${game.i18n.localize('AURAS.Opacity')}
					<span class="units">(0 &mdash; 1)</span>
				</label>
				<input type="number" value="${aura.opacity}" step="any" min="0" max="1"
				       name="flags.${Auras.FLAG}.aura${idx + 1}.opacity">
			</div>
			<div class="form-group">
				<label>
					${game.i18n.localize('SCENES.GridDistance')}
					<span class="units">(${game.i18n.localize('GridUnits')})</span>
				</label>
				<input type="number" value="${aura.distance ? aura.distance : ''}" step="any"
				       name="flags.${Auras.FLAG}.aura${idx + 1}.distance" min="0">
			</div>
			<div class="form-group">
				<label>${game.i18n.localize('AURAS.Style')}</label>
				<select name="flags.${Auras.FLAG}.aura${idx + 1}.style">
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
					name="flags.${Auras.FLAG}.aura${idx + 1}.lineWidth">
			</div>
			<div class="form-group">
				<label>${game.i18n.localize('SCENES.GridSquare')}</label>
				<input type="checkbox" name="flags.${Auras.FLAG}.aura${idx + 1}.square"
                       ${aura.square ? 'checked' : ''}>
			</div>
		`);
		//console.log(auraConfig);

		nav.parent().find('footer').before($(`
			<div class="tab" data-tab="auras">
				${auraConfig[0]}
				<hr>
				${auraConfig[1]}
			</div>
		`));

		nav.parent()
			.find('.tab[data-tab="auras"] input[type="color"][data-edit]')
			.change(config._onChangeInput.bind(config));
	},

	uuid: function () {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
			.replace(/[018]/g, c =>
				(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
	},

	onRefreshToken: function (token) {
		console.log('[ZRT] Token Refresh:', {
			tokenId: token.id,
			hasAuras: !!token.tokenAuras,
			actorFlags: token.document.actor?.flags
		});

		if (token.tokenAuras) {
			const { x, y } = token.document;
			token.tokenAuras.position.set(x, y);
		}
	},

	onUpdateToken: function (token, data) {
		const aurasUpdated =
			data.flags?.[Auras.FLAG]
			&& ['aura1', 'aura2', 'auras'].some(k => typeof data.flags[Auras.FLAG][k] === 'object');

		const hiddenUpdated = "hidden" in data;
		const sizeUpdated = "width" in data || "height" in data;

		if (aurasUpdated || hiddenUpdated || sizeUpdated) Auras.drawAuras(token.object);
	},

	toggleActorAuras: async function (actor) {
		const currentState = actor.getFlag(Auras.FLAG, 'hidden') || false;
		console.log('[ZRT] Toggle - Starting with:', currentState);

		// Set the flag and wait for it to complete
		console.log('[ZRT] Toggle - Setting flag to:', !currentState);
		await actor.update({ [`flags.${Auras.FLAG}.hidden`]: !currentState });

		// Verify the flag was set
		const newState = actor.getFlag(Auras.FLAG, 'hidden');
		console.log('[ZRT] Toggle - Flag is now:', newState);

		// Find and refresh all related tokens
		let tokensUpdated = 0;
		for (let tokenDoc of canvas.scene.tokens) {
			if (tokenDoc.actor?.id === actor.id) {
				tokensUpdated++;
				await tokenDoc.object.refresh();
			}
		}
		console.log('[ZRT] Updated tokens:', tokensUpdated);
	},

	drawAuras: function (token) {
		console.log('[ZRT] Draw Auras - Token:', {
			id: token.id,
			actorId: token.document.actor?.id,
			actorFlags: token.document.actor?.flags,
			flagValue: token.document.actor?.getFlag(Auras.FLAG, 'hidden')
		});
		if (token.tokenAuras?.removeChildren) token.tokenAuras.removeChildren().forEach(c => c.destroy());
		if (token.document.hidden && !game.user.isGM) return;

		const auras = Auras.getAllAuras(token.document).filter(a => {
			console.log('[ZRT] Auras checking by flag', token.document.actor?.getFlag(Auras.FLAG, 'hidden'));
			if (token.document.actor?.getFlag(Auras.FLAG, 'hidden')) {
				console.log('[ZRT] Auras hidden by flag');
				return false;
			}
			//&& game.user.isGM) 
			if (!a.distance || (a.permission === 'gm' && !game.user.isGM)) return false;
			if (game.user.isGM && a.hideGM) return false;
			if (!a.permission || a.permission === 'all' || (a.permission === 'gm' && game.user.isGM)) return true;
			return !!token.document?.actor?.testUserPermission(game.user, a.permission.toUpperCase());
		});

		if (!auras.length) return;

		token.tokenAuras ??= canvas.grid.tokenAuras.addChild(new PIXI.Container());
		const gfx = token.tokenAuras.addChild(new PIXI.Graphics());
		const squareGrid = canvas.scene.grid.type === 1;
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
			let colorValue = Color.from(aura.colour)
			//gfx.beginFill(Color.from(aura.colour), aura.opacity);
			if (aura.style === 'fill' || aura.style === 'both') {
				gfx.beginFill(colorValue, aura.opacity);
			}

			if (aura.style === 'line' || aura.style === 'both') {
				if (!aura.lineWidth) {
					aura.lineWidth = 8;
				}
				gfx.lineStyle(aura.lineWidth, colorValue, aura.opacity);
			}

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


Hooks.on('renderTokenHUD', (hud, html, token) => {
	const controlledActor = game.actors.get(token.actorId);

	const hasOwnerPermission = controlledActor.testUserPermission(game.user, "OWNER");
	console.log("Is Owner:", hasOwnerPermission);
	
	if (!game.user.isGM && !hasOwnerPermission) return;
	console.log("[ZRT] force hud render");


	const hidden = controlledActor.getFlag(Auras.FLAG, 'hidden');
	// console.log("token, Actor", controlledActor);
	const tokenHudButton = $(`<div class="control-icon${hidden ? '' : ' active'}" data-action="toggle-auras">
        <i class="fas fa-ring"></i>
    </div>`);
	html.find('.col.right').append(tokenHudButton);

	const rightCol = html.find('.col.right');
	const otherButtons = rightCol.find('.control-icon');
	// console.log("Other control icons:", otherButtons);

	tokenHudButton.click(async () => {
		//TODO
		// console.log("[ZRT] renderTokenHUD, HUD:", typeof (hud), hud);
		// console.log("[ZRT] renderTokenHUD, HTML", html);
		// console.log("[ZRT] renderTokenHUD, TOKEN", token);
		// console.log("[ZRT] FLAG", Auras.FLAG);


		Auras.debugFlags(controlledActor);

		// console.log("clicked button, ActorId: ", token.actorId, "controlledActor:", controlledActor);
		await Auras.toggleActorAuras(controlledActor);

		hud.render();
	});

});
Hooks.on('renderTokenConfig', Auras.onConfigRender);
Hooks.on('drawToken', Auras.drawAuras);
Hooks.on('refreshToken', Auras.onRefreshToken);
Hooks.on('updateToken', Auras.onUpdateToken);
Hooks.on('drawGridLayer', layer => {
	layer.tokenAuras = layer.addChildAt(new PIXI.Container(), layer.getChildIndex(layer.borders));
});
Hooks.on('destroyToken', token => token.tokenAuras?.destroy());
// Hooks.once('init', () => {
// 	game.modules.get(Auras.FLAG).api = Auras;
// 	FLAG.register(Auras.FLAG);
// });



// Add this hook
Hooks.on('updateActor', (actor, changes) => {
	console.log('[ZRT] Actor Updated:', {
		actor: actor.id,
		changes: changes,
		hasHiddenChange: changes.flags?.[Auras.FLAG]?.hidden !== undefined
	});

	// If our hidden flag changed, refresh all tokens with this actor
	if (changes.flags?.[Auras.FLAG]?.hidden !== undefined) {
		canvas.scene.tokens.forEach(tokenDoc => {
			if (tokenDoc.actor?.id === actor.id) {
				console.log('[ZRT] Refreshing token due to actor update:', tokenDoc.id);
				Auras.drawAuras(tokenDoc.object);
			}
		});
	}
});