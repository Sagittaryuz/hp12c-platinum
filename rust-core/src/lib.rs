#![allow(non_snake_case)]
use chrono::{Datelike, Days, NaiveDate};
use serde::{Deserialize, Serialize};
type CalcResult<T> = Result<T, String>;
const MAX: f64 = 9.999999999e99;
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Tvm {
    n: f64,
    i: f64,
    pv: f64,
    pmt: f64,
    fv: f64,
    begin: bool,
}
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct State {
    schemaVersion: u32,
    x: f64,
    y: f64,
    z: f64,
    t: f64,
    lastX: f64,
    input: String,
    entering: bool,
    lift: bool,
    financialInputReady: bool,
    shift: Option<String>,
    mode: String,
    error: Option<String>,
    decimals: usize,
    fixed: bool,
    powered: bool,
    decimalComma: bool,
    registers: Vec<f64>,
    tvm: Tvm,
    cashflows: Vec<f64>,
    cashflowCounts: Vec<f64>,
    compoundOdd: bool,
    pendingRegister: Option<String>,
    registerDot: bool,
    storeOp: Option<String>,
    pendingGoto: Option<String>,
    gotoPosition: bool,
    pendingOp: Option<String>,
    algOperands: Vec<f64>,
    algOperators: Vec<String>,
    programMode: bool,
    program: Vec<Option<String>>,
    programPrefix: Vec<String>,
    pc: usize,
    paused: bool,
    running: bool,
    angular: String,
    dateFormat: String,
    displayLabel: String,
    displayOverride: Option<String>,
    correlationUndefined: bool,
    undoState: Option<serde_json::Value>,
    #[serde(flatten)]
    extra: serde_json::Map<String, serde_json::Value>,
}
fn err<T>(code: &str) -> CalcResult<T> {
    Err(code.into())
}
// JS chooses the larger magnitude integer at an exact decimal halfway point.
// Work on the exact IEEE-754 rational, avoiding extra binary scaling rounds.
fn decimal_round(n: f64, scale: i32) -> String {
    use num_bigint::BigUint;
    use num_integer::Integer;
    use num_traits::One;
    let bits = n.abs().to_bits();
    let exponent = ((bits >> 52) & 0x7ff) as i32;
    let mantissa = (bits & ((1u64 << 52) - 1)) | if exponent == 0 { 0 } else { 1u64 << 52 };
    let power = if exponent == 0 {
        -1074
    } else {
        exponent - 1023 - 52
    };
    let mut numerator = BigUint::from(mantissa);
    let mut denominator = BigUint::one();
    if power >= 0 {
        numerator <<= power as usize
    } else {
        denominator <<= (-power) as usize
    }
    if scale >= 0 {
        numerator *= BigUint::from(10u32).pow(scale as u32)
    } else {
        denominator *= BigUint::from(10u32).pow((-scale) as u32)
    }
    let (mut q, r) = numerator.div_rem(&denominator);
    if r * 2u32 >= denominator {
        q += 1u32
    }
    q.to_string()
}
fn precision(n: f64) -> CalcResult<f64> {
    if n.is_nan() {
        return err("Error 0");
    }
    if n.abs() > MAX {
        return Ok(n.signum() * MAX);
    }
    if n.abs() < 1e-99 {
        return Ok(0.);
    }
    Ok(significant(n, 10))
}
fn significant(n: f64, d: usize) -> f64 {
    if n == 0. {
        return 0.;
    }
    let exp = format!("{:e}", n.abs())
        .split_once('e')
        .unwrap()
        .1
        .parse::<i32>()
        .unwrap();
    let scale = d as i32 - 1 - exp;
    format!(
        "{}{}e{}",
        if n < 0. { "-" } else { "" },
        decimal_round(n, scale),
        -scale
    )
    .parse()
    .unwrap()
}
fn js_number(n: f64) -> String {
    if n == 0. {
        return "0".into();
    }
    let mut b = ryu::Buffer::new();
    let raw = b.format_finite(n);
    let (mant, exp) = if let Some((a, e)) = raw.split_once('e') {
        (a, e.parse::<i32>().unwrap())
    } else {
        return raw.strip_suffix(".0").unwrap_or(raw).into();
    };
    if (-6..21).contains(&exp) {
        let sign = if mant.starts_with('-') { "-" } else { "" };
        let digits = mant.trim_start_matches('-').replace('.', "");
        let p = exp + 1;
        if p <= 0 {
            format!("{}0.{}{}", sign, "0".repeat((-p) as usize), digits)
        } else if p as usize >= digits.len() {
            format!(
                "{}{}{}",
                sign,
                digits,
                "0".repeat(p as usize - digits.len())
            )
        } else {
            format!(
                "{}{}.{}",
                sign,
                &digits[..p as usize],
                &digits[p as usize..]
            )
        }
    } else {
        format!("{}e{}{}", mant, if exp >= 0 { "+" } else { "" }, exp)
    }
}
fn fixed(n: f64, d: usize) -> f64 {
    if n.abs() >= 1e21 {
        return n;
    }
    format!(
        "{}{}e-{}",
        if n < 0. { "-" } else { "" },
        decimal_round(n, d.min(100) as i32),
        d.min(100)
    )
    .parse()
    .unwrap_or(n)
}
fn result(s: &mut State, n: f64, label: &str, last: bool) -> CalcResult<()> {
    s.correlationUndefined = false;
    if last {
        s.lastX = s.x
    }
    s.x = precision(n)?;
    s.input = js_number(s.x);
    s.entering = false;
    s.lift = true;
    s.financialInputReady = true;
    s.displayLabel = label.into();
    Ok(())
}
fn lift(s: &mut State) {
    s.t = s.z;
    s.z = s.y;
    s.y = s.x
}
fn drop_stack(s: &mut State) {
    s.y = s.z;
    s.z = s.t
}
fn recall(s: &mut State, n: f64, label: &str) -> CalcResult<()> {
    if s.lift && s.mode == "RPN" {
        lift(s)
    }
    result(s, n, label, false)
}
fn value_op(a: f64, b: f64, op: &str) -> CalcResult<f64> {
    if op == "/" && b == 0. || op == "^" && (a == 0. && b <= 0. || a < 0. && b.fract() != 0.) {
        return err("Error 0");
    }
    Ok(match op {
        "+" => a + b,
        "-" => a - b,
        "*" => a * b,
        "/" => a / b,
        _ => a.powf(b),
    })
}
fn op(action: &str) -> &str {
    match action {
        "plus" => "+",
        "minus" => "-",
        "multiply" => "*",
        "divide" => "/",
        _ => "^",
    }
}
fn alg_reduce(s: &mut State) -> CalcResult<()> {
    let Some(o) = s.algOperators.pop() else {
        return Ok(());
    };
    if o == "(" {
        return Ok(());
    }
    let b = s.algOperands.pop().ok_or("Error 0")?;
    let a = s.algOperands.pop().ok_or("Error 0")?;
    s.algOperands.push(precision(value_op(a, b, &o)?)?);
    Ok(())
}
fn root<F: Fn(f64) -> CalcResult<f64>>(f: F, guess: f64, low: f64, high: f64) -> CalcResult<f64> {
    let mut x = guess.clamp(low, high);
    for _ in 0..80 {
        let y = f(x)?;
        if y.abs() < 1e-8 {
            return Ok(x);
        }
        let h = 1e-7_f64.max(x.abs() * 1e-5);
        let derivative = (f(x + h)? - f(x - h)?) / (2. * h);
        if !derivative.is_finite() || derivative.abs() < 1e-14 {
            break;
        }
        let next = x - y / derivative;
        if !next.is_finite() || next <= low || next >= high {
            break;
        }
        if (next - x).abs() < 1e-12 {
            return Ok(next);
        }
        x = next
    }
    let mut points = vec![low];
    points.extend((0..2000).map(|k| low + (high - low) * k as f64 / 1999.));
    points.extend((0..1000).map(|k| {
        ((1. + low).ln() + ((1. + high.min(1e4)).ln() - (1. + low).ln()) * k as f64 / 999.).exp()
            - 1.
    }));
    points.retain(|v| *v >= low && *v <= high);
    points.sort_by(f64::total_cmp);
    let mut a = points[0];
    let mut fa = f(a)?;
    let mut brackets = vec![];
    for b in points.into_iter().skip(1) {
        let fb = f(b)?;
        if fa.is_finite() && fb.is_finite() && fa * fb <= 0. {
            brackets.push((a, b))
        }
        a = b;
        fa = fb
    }
    brackets.sort_by(|a, b| {
        (((a.0 + a.1) / 2. - guess).abs()).total_cmp(&((b.0 + b.1) / 2. - guess).abs())
    });
    let (mut l, mut r) = *brackets.first().ok_or("Error 5")?;
    let mut fl = f(l)?;
    for _ in 0..180 {
        let m = (l + r) / 2.;
        let fm = f(m)?;
        if fm.abs() < 1e-9 || (r - l).abs() < 1e-12 {
            return Ok(m);
        }
        if fl * fm <= 0. {
            r = m
        } else {
            l = m;
            fl = fm
        }
    }
    Ok((l + r) / 2.)
}
fn coefficients(s: &State, n: f64, r: f64) -> CalcResult<[f64; 3]> {
    if r <= -1. || n < 0. {
        return err("Error 5");
    }
    let whole = n.floor();
    let fraction = n - whole;
    let odd = if s.compoundOdd {
        (1. + r).powf(fraction)
    } else {
        1. + r * fraction
    };
    let periods = if fraction > 1e-10 { whole } else { n };
    let discount = (1. + r).powf(-periods);
    Ok([
        odd,
        if r.abs() < 1e-12 {
            periods
        } else {
            (1. - discount) / r * if s.tvm.begin { 1. + r } else { 1. }
        },
        discount,
    ])
}
fn equation(s: &State, n: f64, r: f64) -> CalcResult<f64> {
    let c = coefficients(s, n, r)?;
    Ok(s.tvm.pv * c[0] + s.tvm.pmt * c[1] + s.tvm.fv * c[2])
}
fn tvm_get(s: &State, key: &str) -> f64 {
    match key {
        "n" => s.tvm.n,
        "i" => s.tvm.i,
        "pv" => s.tvm.pv,
        "pmt" => s.tvm.pmt,
        _ => s.tvm.fv,
    }
}
fn tvm_set(s: &mut State, key: &str, n: f64) {
    match key {
        "n" => s.tvm.n = n,
        "i" => s.tvm.i = n,
        "pv" => s.tvm.pv = n,
        "pmt" => s.tvm.pmt = n,
        _ => s.tvm.fv = n,
    }
}
fn financial(s: &mut State, key: &str) -> CalcResult<()> {
    if s.financialInputReady {
        tvm_set(s, key, s.x);
        s.financialInputReady = false;
        s.entering = false;
        s.lift = true;
        s.displayLabel = key.to_uppercase();
        return Ok(());
    }
    if s.tvm.i <= -100. || key == "i" && (s.tvm.n <= 0. || s.tvm.n >= 1e10) {
        return err("Error 5");
    }
    let value = if key == "n" {
        let r = s.tvm.i / 100.;
        let n = root(
            |n| {
                let d = (1. + r).powf(-n);
                Ok(s.tvm.pv
                    + s.tvm.pmt
                        * if r.abs() < 1e-12 {
                            n
                        } else {
                            (1. - d) / r * if s.tvm.begin { 1. + r } else { 1. }
                        }
                    + s.tvm.fv * d)
            },
            s.tvm.n.max(1.),
            0.,
            1e10,
        )?;
        s.tvm.n = (n - 0.005).ceil();
        s.tvm.n
    } else if key == "i" {
        root(
            |r| equation(s, s.tvm.n, r),
            s.tvm.i / 100.,
            -0.99999999,
            10000.,
        )? * 100.
    } else {
        let c = coefficients(s, s.tvm.n, s.tvm.i / 100.)?;
        let idx = match key {
            "pv" => 0,
            "pmt" => 1,
            _ => 2,
        };
        if c[idx].abs() < 1e-30 {
            return err("Error 5");
        }
        let values = [s.tvm.pv, s.tvm.pmt, s.tvm.fv];
        -(0..3)
            .filter(|k| *k != idx)
            .map(|k| values[k] * c[k])
            .sum::<f64>()
            / c[idx]
    };
    tvm_set(s, key, precision(value)?);
    if s.mode == "RPN" {
        lift(s)
    }
    result(s, value, &key.to_uppercase(), false)?;
    s.financialInputReady = false;
    Ok(())
}
fn stats(s: &State) -> CalcResult<[f64; 6]> {
    if s.registers[1] <= 0. {
        return err("Error 2");
    }
    Ok(s.registers[1..7].try_into().unwrap())
}
fn stats_pair(s: &mut State, a: f64, b: f64, label: &str, last: bool) -> CalcResult<()> {
    result(s, a, label, last)?;
    s.y = precision(b)?;
    Ok(())
}
fn regression(s: &State) -> CalcResult<(f64, f64, f64, bool)> {
    let [n, sx, sxx, sy, syy, sxy] = stats(s)?;
    let dx = n * sxx - sx * sx;
    let dy = n * syy - sy * sy;
    if dx <= 0. || dy < 0. {
        return err("Error 2");
    }
    let cross = n * sxy - sx * sy;
    let slope = cross / dx;
    Ok((
        slope,
        (sy - slope * sx) / n,
        if dy == 0. {
            0.
        } else {
            cross / (dx * dy).sqrt()
        },
        dy == 0.,
    ))
}
fn parse_date(value: f64, format: &str) -> CalcResult<NaiveDate> {
    let raw = format!("{:.6}", value.abs());
    let (a, b) = raw.split_once('.').unwrap();
    let first = a.parse::<u32>().map_err(|_| "Error 8")?;
    let second = b[..2].parse::<u32>().unwrap();
    let year = b[2..].parse::<i32>().unwrap();
    let (month, day) = if format == "MDY" {
        (first, second)
    } else {
        (second, first)
    };
    let d = NaiveDate::from_ymd_opt(year, month, day).ok_or("Error 8")?;
    if value < 0.
        || d < NaiveDate::from_ymd_opt(1582, 10, 15).unwrap()
        || d > NaiveDate::from_ymd_opt(4046, 11, 25).unwrap()
    {
        return err("Error 8");
    }
    Ok(d)
}
fn encode_date(d: NaiveDate, format: &str) -> f64 {
    let (a, b) = if format == "MDY" {
        (d.month(), d.day())
    } else {
        (d.day(), d.month())
    };
    format!("{}.{:02}{}", a, b, d.year()).parse().unwrap()
}
struct Bond {
    count: usize,
    a: f64,
    e: f64,
    d: f64,
}
fn bond_dates(s: &State) -> CalcResult<Bond> {
    let settle = parse_date(s.y, &s.dateFormat)?;
    let maturity = parse_date(s.x, &s.dateFormat)?;
    if settle >= maturity || maturity.year() - settle.year() > 500 || s.tvm.pmt < 0. {
        return err(if s.tvm.pmt < 0. { "Error 5" } else { "Error 8" });
    }
    let prev = |d: NaiveDate| -> CalcResult<NaiveDate> {
        let month = d.month() as i32 - 6;
        let (year, month) = if month <= 0 {
            (d.year() - 1, (month + 12) as u32)
        } else {
            (d.year(), month as u32)
        };
        let mut day = maturity.day();
        while NaiveDate::from_ymd_opt(year, month, day).is_none() {
            day -= 1
        }
        Ok(NaiveDate::from_ymd_opt(year, month, day).unwrap())
    };
    if prev(maturity)?.day() != maturity.day() {
        return err("Error 8");
    }
    let mut dates = vec![maturity];
    let mut cursor = maturity;
    while cursor > settle && dates.len() < 1002 {
        cursor = prev(cursor)?;
        dates.insert(0, cursor)
    }
    let prior = dates.remove(0);
    Ok(Bond {
        count: dates.len(),
        a: (settle - prior).num_days() as f64,
        e: (dates[0] - prior).num_days() as f64,
        d: (maturity - settle).num_days() as f64,
    })
}
fn bond_value(y: f64, coupon: f64, q: &Bond) -> f64 {
    let c = coupon / 2.;
    let r = y / 200.;
    let accrued = c * q.a / q.e;
    if q.count == 1 {
        return (100. + c) / (1. + q.d / q.e * r) - accrued;
    }
    (0..q.count)
        .map(|k| c / (1. + r).powf(k as f64 + 1. - q.a / q.e))
        .sum::<f64>()
        + 100. / (1. + r).powf(q.count as f64 - q.a / q.e)
        - accrued
}
fn digit(action: &str) -> bool {
    action.len() == 1 && action.as_bytes()[0].is_ascii_digit()
}
fn contains(list: &[&str], v: &str) -> bool {
    list.contains(&v)
}
fn run(mut s: State, one: bool) -> State {
    s.programMode = false;
    s.running = true;
    s.paused = false;
    if s.entering {
        s.entering = false;
        s.lift = true
    }
    let mut budget = 10000;
    while s.pc < s.program.len() && budget > 0 {
        budget -= 1;
        let instruction = s.program[s.pc].clone();
        s.pc += 1;
        let Some(instruction) = instruction else {
            s.error = Some("Error 4".into());
            s.running = false;
            break;
        };
        if let Some(line) = instruction.strip_prefix("goto:") {
            let line = line.parse::<usize>().unwrap_or(0);
            if line > s.program.len().max(8) {
                s.error = Some("Error 4".into());
                s.running = false;
                break;
            }
            if line == 0 {
                s.pc = 0;
                s.running = false;
                break;
            }
            s.pc = line - 1
        } else if let Some(actions) = instruction.strip_prefix("sequence:") {
            for action in actions.split(',') {
                s = press_action(s, action, true);
                if s.error.is_some() {
                    break;
                }
            }
        } else if instruction == "testLe" {
            if s.x > s.y {
                s.pc += 1
            }
        } else if instruction == "testZero" {
            if s.x != 0. {
                s.pc += 1
            }
        } else if instruction == "runStop" {
            s.running = false;
            break;
        } else if instruction == "pause" {
            s.paused = true;
            s.running = false;
            s.displayLabel = "PSE".into();
            break;
        } else {
            s = press_action(s, &instruction, true)
        }
        if s.error.is_some() || one {
            s.running = false;
            break;
        }
    }
    if s.pc >= s.program.len() && !s.paused {
        s.pc = 0;
        s.running = false
    }
    if budget == 0 {
        s.running = false;
        s.paused = true;
        s.displayLabel = "PROGRAMA PAUSADO".into()
    }
    s
}
pub fn press_action(previous: State, action: &str, executing: bool) -> State {
    let mut s = previous.clone();
    s.displayOverride = None;
    if !executing {
        s.paused = false
    }
    if !s.powered && action != "on" {
        return s;
    }
    if action == "undo" {
        if let Some(v) = s.undoState.take() {
            if let Ok(mut old) = serde_json::from_value::<State>(v) {
                old.undoState = None;
                return old;
            }
        }
        return s;
    }
    if s.error.is_some() {
        s.error = None;
        s.pendingRegister = None;
        s.storeOp = None;
        s.registerDot = false;
        s.pendingGoto = None;
        s.programPrefix.clear();
        s.displayLabel = "PRONTO".into();
        return s;
    }
    if contains(&["shiftF", "shiftG"], action) {
        let shift = if action == "shiftF" { "f" } else { "g" };
        s.shift = Some(shift.into());
        s.displayLabel = shift.into();
        return s;
    }
    if action == "program" {
        s.programMode = !s.programMode;
        if !s.programMode {
            s.pc = 0
        }
        s.entering = false;
        s.programPrefix.clear();
        s.pendingRegister = None;
        s.displayLabel = if s.programMode { "PRGM" } else { "RUN" }.into();
        return s;
    }
    if action == "clearProgram" {
        if s.programMode {
            s.program.clear()
        }
        s.programPrefix.clear();
        s.pc = 0;
        s.pendingGoto = None;
        return s;
    }
    if s.pendingGoto.is_some() {
        if action == "decimal" {
            s.gotoPosition = true;
            return s;
        }
        if digit(action) {
            s.pendingGoto.as_mut().unwrap().push_str(action);
            if s.pendingGoto.as_ref().unwrap().len() == 3 {
                let line = s
                    .pendingGoto
                    .as_ref()
                    .unwrap()
                    .parse::<usize>()
                    .unwrap_or(0);
                if (!s.programMode || s.gotoPosition) && line > s.program.len().max(8) {
                    s.error = Some("Error 4".into());
                    s.pendingGoto = None;
                    return s;
                }
                if s.programMode && !s.gotoPosition {
                    if s.pc >= 400 {
                        s.error = Some("Error 4".into());
                        s.pendingGoto = None;
                        return s;
                    }
                    let command = format!("goto:{}", line);
                    record(&mut s, command)
                } else {
                    s.pc = line
                }
                s.pendingGoto = None;
                s.gotoPosition = false
            }
            return s;
        }
        s.pendingGoto = None
    }
    if action == "goto" {
        s.pendingGoto = Some(String::new());
        s.gotoPosition = false;
        return s;
    }
    let mut action = action.to_string();
    if s.programMode && !executing {
        if action == "step" {
            s.pc = (s.pc + 1) % (s.program.len().max(8) + 1);
            return s;
        }
        if action == "backStep" {
            s.pc = s.pc.saturating_sub(1);
            return s;
        }
        if contains(&["store", "recall"], &action) {
            s.programPrefix = vec![action];
            return s;
        }
        if !s.programPrefix.is_empty() && !contains(&["shiftF", "shiftG"], &action) {
            if action == "decimal"
                || s.programPrefix[0] == "store"
                    && contains(&["plus", "minus", "multiply", "divide"], &action)
            {
                s.programPrefix.push(action);
                return s;
            }
            if digit(&action)
                || contains(
                    &["n", "i", "pv", "pmt", "fv", "cf0", "cfj", "nj", "eex"],
                    &action,
                )
            {
                s.programPrefix.push(action);
                action = format!("sequence:{}", s.programPrefix.join(","))
            }
            s.programPrefix.clear()
        }
        if !contains(
            &["shiftF", "shiftG", "prefix", "memory", "on", "off"],
            &action,
        ) {
            if s.pc >= 400 {
                s.error = Some("Error 4".into());
                return s;
            }
            record(&mut s, action);
            s.displayLabel = "PRGM".into();
            return s;
        }
    }
    if !executing {
        if contains(
            &["clx", "backspace", "clearStats", "clearFin", "clearReg"],
            &action,
        ) {
            let mut snapshot = serde_json::to_value(&previous).unwrap();
            snapshot.as_object_mut().unwrap().remove("undoState");
            s.undoState = Some(snapshot)
        } else {
            s.undoState = None
        }
    }

    if let Err(error) = execute(&mut s, &previous, &action) {
        let mut original = previous;
        original.error = Some(error.clone());
        original.displayLabel = error;
        original.running = false;
        original.shift = None;
        return original;
    }
    s
}
fn record(s: &mut State, action: String) {
    if s.pc < s.program.len() {
        s.program[s.pc] = Some(action)
    } else {
        while s.program.len() < s.pc {
            s.program.push(None)
        }
        s.program.push(Some(action))
    }
    s.pc += 1
}
fn execute(s: &mut State, previous: &State, action: &str) -> CalcResult<()> {
    if let Some(pending) = s.pendingRegister.clone() {
        if action == "decimal" {
            s.registerDot = true;
            return Ok(());
        }
        let financial = contains(&["n", "i", "pv", "pmt", "fv"], action);
        if contains(&["cf0", "cfj", "nj"], action) {
            let j = if action == "cf0" { 0. } else { s.tvm.n.floor() };
            if j < 0. || j >= s.cashflows.len() as f64 {
                return err("Error 6");
            }
            let j = j as usize;
            if pending == "recall" {
                recall(
                    s,
                    if action == "nj" {
                        s.cashflowCounts[j]
                    } else if j < 20 {
                        s.registers[j]
                    } else {
                        s.cashflows[j]
                    },
                    action,
                )?;
                if action == "cfj" {
                    s.tvm.n = j as f64 - 1.
                }
            } else if action == "nj" {
                if j == 0 || s.x < 0. || s.x > 99. || s.x.fract() != 0. {
                    return err("Error 6");
                }
                s.cashflowCounts[j] = s.x
            } else {
                s.cashflows[j] = s.x;
                if j < 20 {
                    s.registers[j] = s.x
                }
            }
            s.pendingRegister = None;
            s.registerDot = false;
            s.storeOp = None;
            return Ok(());
        }
        if digit(action) || financial {
            let idx = action.parse::<usize>().unwrap_or(0) + if s.registerDot { 10 } else { 0 };
            if s.storeOp.is_some() && (financial || idx > 4) {
                return err("Error 4");
            }
            let value = if financial {
                tvm_get(s, action)
            } else {
                s.registers[idx]
            };
            if pending == "recall" {
                recall(
                    s,
                    value,
                    &if financial {
                        action.to_uppercase()
                    } else {
                        format!("R{}", idx)
                    },
                )?
            } else {
                let value = if let Some(o) = &s.storeOp {
                    value_op(value, s.x, o)?
                } else {
                    s.x
                };
                if value.abs() > MAX {
                    return err("Error 1");
                }
                if financial {
                    tvm_set(s, action, precision(value)?)
                } else {
                    s.registers[idx] = precision(value)?;
                    if idx < s.cashflows.len() {
                        s.cashflows[idx] = s.registers[idx]
                    }
                }
                s.entering = false;
                s.lift = true
            }
            s.pendingRegister = None;
            s.storeOp = None;
            s.registerDot = false;
            return Ok(());
        }
        if pending == "store" && contains(&["plus", "minus", "multiply", "divide"], action) {
            s.storeOp = Some(op(action).into());
            return Ok(());
        }
        if pending == "store" && action == "eex" {
            s.compoundOdd = !s.compoundOdd;
            s.pendingRegister = None;
            return Ok(());
        }
        s.pendingRegister = None;
    }
    if digit(action) || action == "decimal" {
        if !s.entering {
            if s.lift && s.mode == "RPN" {
                lift(s)
            } else if s.mode == "ALG" && s.pendingOp.is_none() {
                s.y = s.x
            }
            s.input = if action == "decimal" { "0." } else { action }.into();
            s.entering = true
        } else if action == "decimal" {
            if !s.input.contains('.') && !s.input.contains('e') {
                s.input.push('.')
            }
        } else if let Some((m, e)) = s.input.split_once('e') {
            let negative = e.starts_with('-');
            let digits = e.replace('-', "");
            let d = if digits == "0" {
                action.into()
            } else {
                let d = format!("{}{}", digits, action);
                d[d.len().saturating_sub(2)..].to_string()
            };
            s.input = format!("{}e{}{}", m, if negative { "-" } else { "" }, d)
        } else if s.input.replace(['-', '.'], "").len() < 10 {
            if s.input == "0" {
                s.input.clear()
            } else if s.input == "-0" {
                s.input = "-".into()
            }
            s.input.push_str(action)
        }
        s.x = precision(s.input.parse().map_err(|_| "Error 0")?)?;
        s.lift = true;
        s.financialInputReady = true;
        s.displayLabel = "ENTRADA".into();
        return Ok(());
    }
    if action.starts_with("fixed") && action.len() == 6 && digit(&action[5..]) {
        s.decimals = action[5..].parse().unwrap();
        s.fixed = true;
        s.entering = false;
        s.displayLabel = format!("FIX {}", s.decimals);
        return Ok(());
    }
    match action {
        "on" => {
            s.powered = !s.powered;
            s.shift = None
        }
        "off" => s.powered = false,
        "chs" => {
            if s.entering && s.input.contains('e') {
                s.input = if s.input.contains("e-") {
                    s.input.replace("e-", "e")
                } else {
                    s.input.replace('e', "e-")
                };
                s.x = precision(s.input.parse().map_err(|_| "Error 0")?)?
            } else if s.entering {
                s.input = if s.input.starts_with('-') {
                    s.input[1..].into()
                } else {
                    format!("-{}", s.input)
                };
                s.x = precision(s.input.parse().map_err(|_| "Error 0")?)?
            } else {
                result(s, -s.x, "RESULTADO", false)?
            }
        }
        "eex" => {
            if !s.entering {
                if s.x == 0. {
                    s.x = 1.
                }
                s.input = js_number(s.x);
                s.entering = true
            }
            if !s.input.contains('e') {
                s.input.push_str("e0")
            }
            s.financialInputReady = true
        }
        "backspace" => {
            if !s.entering {
                s.input = js_number(s.x);
                s.entering = true;
                s.lift = false
            }
            s.input.pop();
            if s.input.ends_with('e') || s.input.ends_with("e-") || s.input.ends_with("e+") {
                s.input = s.input.split('e').next().unwrap().into()
            }
            if s.input.is_empty() || s.input == "-" {
                s.input = "0".into()
            }
            s.x = precision(s.input.parse().map_err(|_| "Error 0")?)?
        }
        "enter" | "equals" => {
            if s.mode == "ALG" {
                if !s.algOperators.is_empty() {
                    s.algOperands.push(s.x);
                    while !s.algOperators.is_empty() {
                        alg_reduce(s)?
                    }
                    let n = s.algOperands.pop().unwrap_or(s.x);
                    result(s, n, "RESULTADO", true)?
                }
                s.y = s.x;
                s.entering = false;
                s.lift = false;
                s.financialInputReady = true;
                s.algOperands.clear();
                s.algOperators.clear();
                s.pendingOp = None
            } else {
                lift(s);
                s.entering = false;
                s.lift = false
            }
        }
        "plus" | "minus" | "multiply" | "divide" | "pow" => {
            let o = op(action);
            if s.mode == "ALG" {
                if s.displayLabel == "ALG OP"
                    && s.pendingOp.is_some()
                    && s.algOperators.last() == s.pendingOp.as_ref()
                {
                    *s.algOperators.last_mut().unwrap() = o.into();
                    s.pendingOp = Some(o.into());
                    return Ok(());
                }
                s.algOperands.push(s.x);
                while !s.algOperators.is_empty() && s.algOperators.last().unwrap() != "(" {
                    alg_reduce(s)?
                }
                s.algOperators.push(o.into());
                s.x = *s.algOperands.last().unwrap();
                s.pendingOp = Some(o.into());
                s.entering = false;
                s.lift = false;
                s.displayLabel = "ALG OP".into()
            } else {
                result(s, value_op(s.y, s.x, o)?, "RESULTADO", true)?;
                drop_stack(s)
            }
            s.x = precision(s.x)?
        }
        "parenOpen" => {
            if s.mode == "ALG" {
                if s.algOperators.iter().filter(|o| *o == "(").count() >= 13 {
                    return err("Error 4");
                }
                s.pendingOp = None;
                s.algOperators.push("(".into());
                s.entering = false;
                s.lift = false
            }
        }
        "parenClose" => {
            if s.mode == "ALG" {
                s.algOperands.push(s.x);
                while !s.algOperators.is_empty() && s.algOperators.last().unwrap() != "(" {
                    alg_reduce(s)?
                }
                if s.algOperators.pop().as_deref() != Some("(") {
                    return err("Error 0");
                }
                let n = s.algOperands.pop().unwrap_or(s.x);
                result(s, n, "RESULTADO", true)?;
                s.pendingOp = None
            }
        }
        "clx" => {
            if s.mode == "ALG" && previous.displayLabel == "CLX" {
                s.algOperands.clear();
                s.algOperators.clear();
                s.pendingOp = None
            }
            s.displayLabel = "CLX".into();
            s.x = 0.;
            s.input = "0".into();
            s.entering = false;
            s.lift = false;
            s.financialInputReady = true
        }
        "roll" => {
            let x = s.x;
            s.x = s.y;
            s.y = s.z;
            s.z = s.t;
            s.t = x;
            s.entering = false;
            s.lift = true
        }
        "swap" => {
            if s.correlationUndefined {
                return err("Error 2");
            }
            std::mem::swap(&mut s.x, &mut s.y);
            s.entering = false;
            s.lift = true
        }
        "store" | "recall" => {
            s.pendingRegister = Some(action.into());
            s.registerDot = false;
            s.displayLabel = if action == "store" { "STO" } else { "RCL" }.into()
        }
        "lastX" => recall(s, s.lastX, "LST x")?,
        "toggleSeparator" => {
            s.decimalComma = !s.decimalComma;
            s.powered = true
        }
        "modeRpn" | "modeAlg" => {
            s.mode = if action == "modeRpn" { "RPN" } else { "ALG" }.into();
            s.algOperands.clear();
            s.algOperators.clear();
            s.pendingOp = None;
            s.entering = false
        }
        "begin" | "end" => {
            s.entering = false;
            s.tvm.begin = action == "begin"
        }
        "n" | "i" | "pv" | "pmt" | "fv" => financial(s, action)?,
        "12x" | "12div" => {
            result(
                s,
                if action == "12x" {
                    s.x * 12.
                } else {
                    s.x / 12.
                },
                if action == "12x" { "n" } else { "i" },
                true,
            )?;
            tvm_set(s, if action == "12x" { "n" } else { "i" }, s.x);
            s.financialInputReady = false
        }
        "clearFin" => {
            s.tvm = Tvm {
                n: 0.,
                i: 0.,
                pv: 0.,
                pmt: 0.,
                fv: 0.,
                begin: s.tvm.begin,
            };
            s.financialInputReady = false
        }
        "clearStats" | "clearReg" => {
            if action == "clearStats" {
                for k in 1..=6 {
                    s.registers[k] = 0.
                }
            } else {
                s.registers = vec![0.; 20];
                s.cashflows = vec![0.];
                s.cashflowCounts = vec![1.];
                s.tvm = Tvm {
                    n: 0.,
                    i: 0.,
                    pv: 0.,
                    pmt: 0.,
                    fv: 0.,
                    begin: s.tvm.begin,
                };
                s.lastX = 0.
            }
            s.x = 0.;
            s.y = 0.;
            s.z = 0.;
            s.t = 0.;
            s.input = "0".into();
            s.entering = false;
            s.financialInputReady = false;
            s.lift = false
        }
        "amortize" => {
            let count = s.x;
            if count.fract() != 0. || count <= 0. || s.tvm.i <= -100. {
                return err("Error 5");
            }
            let mut balance = fixed(s.tvm.pv, s.decimals);
            let mut interest = 0.;
            let mut principal = 0.;
            for k in 0..count as usize {
                let it = if s.tvm.begin && s.tvm.n == 0. && k == 0 {
                    0.
                } else {
                    fixed(-balance * s.tvm.i / 100., s.decimals)
                };
                let pr = fixed(s.tvm.pmt, s.decimals) - it;
                interest += it;
                principal += pr;
                balance += pr
            }
            s.tvm.pv = precision(balance)?;
            s.tvm.n += count;
            s.t = s.y;
            result(s, interest, "AMORT", false)?;
            s.y = precision(principal)?;
            s.z = count
        }
        "interest" => {
            s.t = s.x;
            let i = -s.tvm.pv * s.tvm.i * s.tvm.n / 36000.;
            result(s, i, "INT 360", false)?;
            s.y = -s.tvm.pv;
            s.z = precision(-s.tvm.pv * s.tvm.i * s.tvm.n / 36500.)?
        }
        "cf0" => {
            s.cashflows = vec![s.x];
            s.cashflowCounts = vec![1.];
            s.registers[0] = s.x;
            s.tvm.n = 0.;
            s.entering = false;
            s.lift = true
        }
        "cfj" => {
            if s.tvm.n.fract() != 0. {
                return err("Error 6");
            }
            let j = s.tvm.n + 1.;
            if j < 1. || j > 80. || j > s.cashflows.len() as f64 {
                return err("Error 6");
            }
            let j = j as usize;
            if j == s.cashflows.len() {
                s.cashflows.push(s.x);
                s.cashflowCounts.push(1.)
            } else {
                s.cashflows[j] = s.x;
                s.cashflowCounts[j] = 1.
            }
            s.tvm.n = j as f64;
            if j < 20 {
                s.registers[j] = s.x
            }
            s.entering = false;
            s.lift = true
        }
        "nj" => {
            let j = s.tvm.n;
            if s.x < 0.
                || s.x > 99.
                || s.x.fract() != 0.
                || j.fract() != 0.
                || j <= 0.
                || j >= s.cashflows.len() as f64
            {
                return err("Error 6");
            }
            s.cashflowCounts[j as usize] = s.x;
            s.entering = false;
            s.lift = true
        }
        "npv" | "irr" => {
            let count = s.tvm.n;
            if count.fract() != 0. || count < 0. || count > 80. || count >= s.cashflows.len() as f64
            {
                return err("Error 6");
            }
            let count = count as usize;
            let f = |r: f64| -> CalcResult<f64> {
                let mut total = s.registers[0];
                let mut period = 0.;
                for j in 1..=count {
                    for _ in 0..s.cashflowCounts[j].ceil() as usize {
                        period += 1.;
                        total += if j < 20 {
                            s.registers[j]
                        } else {
                            s.cashflows[j]
                        } / (1. + r).powf(period)
                    }
                }
                Ok(total)
            };
            if s.tvm.i <= -100. {
                return err("Error 5");
            }
            if action == "irr" {
                let mut flows = vec![s.registers[0]];
                flows.extend((1..=count).filter(|j| s.cashflowCounts[*j] > 0.).map(|j| {
                    if j < 20 {
                        s.registers[j]
                    } else {
                        s.cashflows[j]
                    }
                }));
                if !flows.iter().any(|v| *v > 0.) || !flows.iter().any(|v| *v < 0.) {
                    return err("Error 7");
                }
            }
            let value = if action == "npv" {
                f(s.tvm.i / 100.)?
            } else {
                root(f, s.tvm.i / 100., -0.99999999, 10000.).map_err(|e| {
                    if e == "Error 5" {
                        "Error 7".to_string()
                    } else {
                        "Error 3".to_string()
                    }
                })? * 100.
            };
            if s.mode == "RPN" {
                lift(s)
            }
            result(s, value, &action.to_uppercase(), false)?;
            if action == "irr" {
                s.tvm.i = s.x
            }
        }
        "bondPrice" | "bondYield" => {
            let dates = bond_dates(s)?;
            if action == "bondPrice" {
                let price = bond_value(s.tvm.i, s.tvm.pmt, &dates);
                if s.mode == "RPN" {
                    s.t = s.y;
                    s.z = s.x
                }
                result(s, price, "PRICE", false)?;
                s.tvm.pv = s.x;
                s.y = precision(s.tvm.pmt / 2. * dates.a / dates.e)?
            } else {
                let value = root(
                    |r| Ok(bond_value(r * 100., s.tvm.pmt, &dates) - s.tvm.pv),
                    s.tvm.i / 100.,
                    -1.999,
                    100.,
                )? * 100.;
                if s.mode == "RPN" {
                    lift(s)
                }
                result(s, value, "YTM", false)?;
                s.tvm.i = s.x
            }
            s.tvm.fv = 100. + s.tvm.pmt / 2.;
            s.tvm.n = 1. - dates.a / dates.e
        }
        "deprSL" | "deprSOYD" | "deprDB" => {
            let year = s.x.trunc();
            let n = s.tvm.n;
            let cost = s.tvm.pv;
            let salvage = s.tvm.fv;
            if s.x.fract() != 0. || year < 1. || n <= 0. || cost < salvage {
                return err("Error 5");
            }
            let mut depreciation = 0.;
            let mut book = cost;
            let whole = n.floor();
            let fraction = n - whole;
            let soyd = (whole + 1.) * (whole + 2. * fraction) / 2.;
            for k in 1..=year as usize {
                let k = k as f64;
                depreciation = if k > n {
                    0.
                } else if action == "deprSL" {
                    (cost - salvage) / n
                } else if action == "deprSOYD" {
                    (cost - salvage) * (n - k + 1.) / soyd
                } else {
                    (book - salvage).max(0.).min(book * s.tvm.i / 100. / n)
                };
                book -= depreciation
            }
            if s.mode == "RPN" {
                s.t = s.y;
                s.z = s.x
            }
            result(s, depreciation, &action[4..], false)?;
            s.y = precision(book - salvage)?
        }
        "sigmaPlus" | "sigmaMinus" => {
            let sign = if action == "sigmaPlus" { 1. } else { -1. };
            let x = s.x;
            let y = s.y;
            for (k, v) in [1., x, x * x, y, y * y, x * y].iter().enumerate() {
                let sum = s.registers[k + 1] + sign * v;
                if sum.abs() > MAX {
                    return err("Error 1");
                }
                s.registers[k + 1] = precision(sum)?
            }
            result(s, s.registers[1], "n", true)?;
            s.lift = false
        }
        "mean" => {
            let [n, sx, _, sy, _, _] = stats(s)?;
            stats_pair(s, sx / n, sy / n, "x̄", false)?
        }
        "stddev" => {
            let [n, sx, sxx, sy, syy, _] = stats(s)?;
            if n <= 1. || n * sxx - sx * sx < 0. || n * syy - sy * sy < 0. {
                return err("Error 2");
            }
            stats_pair(
                s,
                ((sxx - sx * sx / n) / (n - 1.)).max(0.).sqrt(),
                ((syy - sy * sy / n) / (n - 1.)).max(0.).sqrt(),
                "s",
                false,
            )?
        }
        "weightedMean" => {
            let [_, sx, _, _, _, sxy] = stats(s)?;
            if sx == 0. {
                return err("Error 2");
            }
            result(s, sxy / sx, "x̄w", false)?
        }
        "estimateX" | "estimateY" => {
            let (slope, intercept, r, undefined) = regression(s)?;
            if action == "estimateX" && slope == 0. {
                return err("Error 2");
            }
            stats_pair(
                s,
                if action == "estimateY" {
                    intercept + slope * s.x
                } else {
                    (s.x - intercept) / slope
                },
                r,
                if action == "estimateY" {
                    "ŷ,r"
                } else {
                    "x̂,r"
                },
                true,
            )?;
            s.correlationUndefined = undefined
        }
        "reciprocal" => {
            if s.x == 0. {
                return err("Error 0");
            }
            result(s, 1. / s.x, "RESULTADO", true)?
        }
        "sin" | "cos" | "tan" => {
            let angle = if s.angular == "DEG" {
                (s.x % 360.) * std::f64::consts::PI / 180.
            } else {
                s.x
            };
            if action == "tan" && angle.cos().abs() < 1e-14 {
                return err("Error 0");
            }
            let n = match action {
                "sin" => angle.sin(),
                "cos" => angle.cos(),
                _ => angle.tan(),
            };
            if !n.is_finite() {
                return err("Error 0");
            }
            result(
                s,
                if n.abs() < 1e-14 { 0. } else { n },
                &format!("{} {}", action.to_uppercase(), s.angular),
                true,
            )?
        }
        "sqrt" => result(s, s.x.sqrt(), "RESULTADO", true)?,
        "ln" => {
            if s.x <= 0. {
                return err("Error 0");
            }
            result(s, s.x.ln(), "RESULTADO", true)?
        }
        "exp" => result(s, s.x.exp(), "RESULTADO", true)?,
        "square" => result(s, s.x * s.x, "RESULTADO", true)?,
        "intg" => result(s, s.x.trunc(), "RESULTADO", true)?,
        "frac" => result(s, s.x - s.x.trunc(), "RESULTADO", true)?,
        "factorial" => {
            if s.x < 0. || s.x.fract() != 0. {
                return err("Error 0");
            }
            let mut value = 1.;
            if s.x >= 70. {
                value = MAX
            } else {
                for k in 2..=s.x as usize {
                    value *= k as f64
                }
            }
            result(s, value, "RESULTADO", true)?
        }
        "pct" => {
            let base = if s.mode == "ALG" {
                if contains(&["+", "-"], s.pendingOp.as_deref().unwrap_or("")) {
                    *s.algOperands.last().unwrap_or(&s.y)
                } else {
                    1.
                }
            } else {
                s.y
            };
            result(s, base * s.x / 100., "%", true)?
        }
        "pctT" | "deltaPct" => {
            let base = if s.mode == "ALG" {
                *s.algOperands.last().unwrap_or(&s.y)
            } else {
                s.y
            };
            if base == 0. {
                return err("Error 0");
            }
            result(
                s,
                if action == "pctT" {
                    s.x / base * 100.
                } else {
                    (s.x - base) / base * 100.
                },
                if action == "pctT" { "%T" } else { "Δ%" },
                true,
            )?
        }
        "round" => {
            let n = if s.fixed {
                fixed(s.x, s.decimals)
            } else {
                significant(s.x, 7)
            };
            result(s, n, "RND", true)?
        }
        "scientific" => {
            s.fixed = false;
            s.entering = false
        }
        "mdy" | "dmy" => {
            s.entering = false;
            s.dateFormat = action.to_uppercase()
        }
        "date" => {
            let d = parse_date(s.y, &s.dateFormat)?;
            let delta = s.x.trunc();
            let date = if delta >= 0. {
                d.checked_add_days(Days::new(delta as u64))
            } else {
                d.checked_sub_days(Days::new(-delta as u64))
            }
            .ok_or("Error 8")?;
            if date < NaiveDate::from_ymd_opt(1582, 10, 15).unwrap()
                || date > NaiveDate::from_ymd_opt(4046, 11, 25).unwrap()
            {
                return err("Error 8");
            }
            result(s, encode_date(date, &s.dateFormat), "DATE", true)?;
            drop_stack(s);
            s.displayOverride = Some(format!(
                "{:.6} {}",
                s.x,
                date.weekday().number_from_monday()
            ))
        }
        "days" => {
            let a = parse_date(s.y, &s.dateFormat)?;
            let b = parse_date(s.x, &s.dateFormat)?;
            result(s, (b - a).num_days() as f64, "ΔDYS", true)?;
            let d1 = a.day().min(30);
            let d2 = if b.day() == 31 && d1 == 30 {
                30
            } else {
                b.day()
            };
            s.y = ((b.year() - a.year()) * 360
                + (b.month() as i32 - a.month() as i32) * 30
                + d2 as i32
                - d1 as i32) as f64
        }
        "runStop" | "step" => *s = run(s.clone(), action == "step"),
        "backStep" => {
            s.pc = s.pc.saturating_sub(1);
            s.displayLabel = format!("STEP {}", s.pc)
        }
        "pause" => s.paused = true,
        "testZero" | "testLe" => {
            s.displayLabel = if if action == "testZero" {
                s.x == 0.
            } else {
                s.x <= s.y
            } {
                "VERDADEIRO"
            } else {
                "FALSO"
            }
            .into()
        }
        "prefix" => {
            s.shift = None;
            s.pendingRegister = None;
            s.pendingGoto = None;
            s.programPrefix.clear();
            s.displayLabel = "MANTISSA".into();
            s.displayOverride = Some(
                format!("{:.9e}", s.x.abs())
                    .split('e')
                    .next()
                    .unwrap()
                    .replace('.', ""),
            )
        }
        "memory" => s.displayOverride = Some(format!("P{:03} r20", s.program.len().max(8))),
        "toggleAngular" => s.angular = if s.angular == "DEG" { "RAD" } else { "DEG" }.into(),
        _ => return Err(format!("Função desconhecida: {}", action)),
    }
    Ok(())
}
#[derive(Deserialize)]
struct Request {
    state: State,
    action: String,
    #[serde(default)]
    executing: bool,
    #[serde(default)]
    operation: String,
    #[serde(default)]
    index: usize,
    #[serde(default)]
    value: f64,
}
pub fn compute(json: &[u8]) -> CalcResult<Vec<u8>> {
    let r: Request = serde_json::from_slice(json).map_err(|e| e.to_string())?;
    if r.state.registers.len() != 20 || r.state.cashflows.len() != r.state.cashflowCounts.len() {
        return err("Invalid state");
    }
    let next = if r.operation == "editMemory" {
        let mut state = r.state;
        if r.index >= 20
            || state.running
            || state.paused
            || state.programMode
            || !r.value.is_finite()
            || r.value.abs() > MAX
        {
            return err("Invalid memory edit");
        }
        let value = precision(r.value)?;
        state.registers[r.index] = value;
        if r.index < state.cashflows.len() {
            state.cashflows[r.index] = value
        }
        state
    } else {
        press_action(r.state, &r.action, r.executing)
    };
    serde_json::to_vec(&next).map_err(|e| e.to_string())
}
// A narrow owned byte-buffer ABI; no DOM imports, no JS calculation callbacks.
#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let bytes = vec![0u8; len].into_boxed_slice();
    Box::into_raw(bytes) as *mut u8
}
#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len)))
}
#[no_mangle]
pub unsafe extern "C" fn calculate(ptr: *const u8, len: usize) -> u64 {
    let input = std::slice::from_raw_parts(ptr, len);
    let output = compute(input)
        .unwrap_or_else(|e| serde_json::to_vec(&serde_json::json!({"abiError":e})).unwrap());
    let len = output.len();
    let ptr = Box::into_raw(output.into_boxed_slice()) as *mut u8;
    ((len as u64) << 32) | (ptr as u64)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn decimal_rounding_matches_js() {
        assert_eq!(fixed(2.5, 0), 3.);
        assert_eq!(fixed(-2.5, 0), -3.);
        assert_eq!(fixed(2.675, 2), 2.67);
        assert_eq!(fixed(1.005, 2), 1.);
        assert_eq!(precision(1.2345678915).unwrap(), 1.234567892);
        assert_eq!(precision(1e-100).unwrap(), 0.);
        assert_eq!(precision(f64::INFINITY).unwrap(), MAX);
        assert!(precision(f64::NAN).is_err());
    }
    #[test]
    fn calendar_boundaries_and_leap_years() {
        assert!(parse_date(2.292000, "MDY").is_ok());
        assert!(parse_date(2.291900, "MDY").is_err());
        assert!(parse_date(10.141582, "MDY").is_err());
        assert!(parse_date(10.151582, "MDY").is_ok());
        assert!(parse_date(11.264046, "MDY").is_err());
    }
    #[test]
    fn rpn_state_and_errors_restore_original_values() {
        let initial: State =
            serde_json::from_slice(include_bytes!("../../tests/fixtures/initial-state.json"))
                .unwrap();
        let mut s = initial;
        for action in ["2", "enter", "3", "plus"] {
            s = press_action(s, action, false)
        }
        assert_eq!(s.x, 5.);
        let snapshot = s.clone();
        s.x = 0.;
        let invalid = press_action(s, "divide", false);
        assert_eq!(invalid.error.as_deref(), Some("Error 0"));
        assert_eq!(invalid.y, snapshot.y);
    }
}
