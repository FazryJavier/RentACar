<?php

namespace App\Support\Svg;

use DOMAttr;
use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Allowlist SVG sanitiser for uploaded logos. Anything not explicitly allowed is removed:
 * scripts, foreignObject, event handlers, external references, DOCTYPE/entities.
 * Returns null when the input is not a usable SVG.
 */
final class SvgSanitizer
{
    private const ELEMENTS = [
        'svg', 'g', 'defs', 'symbol', 'use', 'title', 'desc',
        'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'text', 'tspan', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'pattern',
    ];

    private const ATTRIBUTES = [
        'id', 'class', 'style', 'xmlns', 'xmlns:xlink', 'version', 'viewbox', 'preserveaspectratio',
        'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'r', 'rx', 'ry', 'cx', 'cy', 'fx', 'fy',
        'd', 'points', 'transform', 'opacity', 'fill', 'fill-opacity', 'fill-rule', 'clip-rule',
        'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
        'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset',
        'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform', 'spreadmethod',
        'clip-path', 'clippathunits', 'mask', 'maskunits', 'maskcontentunits', 'patternunits',
        'patterncontentunits', 'patterntransform', 'font-family', 'font-size', 'font-weight',
        'font-style', 'text-anchor', 'dominant-baseline', 'letter-spacing', 'display', 'visibility',
        'href', 'xlink:href',
    ];

    public function sanitize(string $svg): ?string
    {
        // Entities and DOCTYPEs are the vector for XXE and billion-laughs attacks: refuse them.
        if (preg_match('/<!DOCTYPE|<!ENTITY/i', $svg) === 1) {
            return null;
        }

        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        $loaded = $document->loadXML($svg, LIBXML_NONET | LIBXML_NOBLANKS);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $document->documentElement;
        if (! $loaded || ! $root instanceof DOMElement || strtolower($root->localName) !== 'svg') {
            return null;
        }

        $this->clean($root);

        $output = $document->saveXML($root);

        return $output === false || trim($output) === '' ? null : $output;
    }

    private function clean(DOMElement $element): void
    {
        foreach (iterator_to_array($element->attributes ?? []) as $attribute) {
            if (! $this->allowedAttribute($attribute)) {
                $element->removeAttributeNode($attribute);
            }
        }

        foreach (iterator_to_array($element->childNodes) as $child) {
            if ($child instanceof DOMElement) {
                if (! in_array(strtolower($child->localName), self::ELEMENTS, true)) {
                    $element->removeChild($child);

                    continue;
                }
                $this->clean($child);
            } elseif (! $this->allowedNode($child)) {
                $element->removeChild($child);
            }
        }
    }

    private function allowedNode(DOMNode $node): bool
    {
        // Text and CDATA inside allowed elements (e.g. <text>, <title>) are fine; comments and
        // processing instructions are dropped.
        return in_array($node->nodeType, [XML_TEXT_NODE, XML_CDATA_SECTION_NODE], true);
    }

    private function allowedAttribute(DOMAttr $attribute): bool
    {
        $name = strtolower($attribute->prefix !== '' ? $attribute->prefix.':'.$attribute->localName : $attribute->localName);
        $value = trim($attribute->value);

        if (! in_array($name, self::ATTRIBUTES, true)) {
            return false;
        }

        if (in_array($name, ['href', 'xlink:href'], true)) {
            return str_starts_with($value, '#');
        }

        if (preg_match('/javascript:|expression\s*\(|@import|url\s*\(\s*["\']?(?!#)/i', $value) === 1) {
            return false;
        }

        return true;
    }
}
